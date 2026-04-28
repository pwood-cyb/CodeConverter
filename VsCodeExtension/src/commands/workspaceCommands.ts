import { randomUUID } from "node:crypto";
import * as path from "node:path";
import * as vscode from "vscode";
import { ConversionDirection } from "./registerCommands";
import { createConversionPreferences } from "../settings/configuration";
import { isSupportedSourceFile } from "../context/resourceContext";
import { showConversionFailure } from "../feedback/notificationPresenter";
import { showConversionSummary } from "../feedback/summaryPresenter";
import {
  ConversionOutcome,
  ConversionRequest,
  ConversionResponse
} from "../worker/protocol";
import { WorkerClient } from "../worker/workerClient";

const overwriteApprovalMessage = "Overwrite approval required before applying workspace changes.";

function distinctResources(resource: vscode.Uri | undefined, resources: readonly vscode.Uri[] | undefined): vscode.Uri[] {
  const allResources = [...(resources ?? []), ...(resource ? [resource] : [])];
  const seen = new Set<string>();
  const distinct: vscode.Uri[] = [];
  for (const uri of allResources) {
    const key = uri.fsPath.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      distinct.push(uri);
    }
  }

  return distinct;
}

function matchesDirection(resource: vscode.Uri, direction: ConversionDirection): boolean {
  const resourcePath = resource.fsPath;
  return direction === "vb-to-cs"
    ? resourcePath.toLowerCase().endsWith(".vb")
    : resourcePath.toLowerCase().endsWith(".cs");
}

function getSupportedResources(
  resource: vscode.Uri | undefined,
  resources: readonly vscode.Uri[] | undefined,
  direction: ConversionDirection
): vscode.Uri[] {
  return distinctResources(resource, resources)
    .filter(uri => isSupportedSourceFile(uri.fsPath))
    .filter(uri => matchesDirection(uri, direction));
}

function createRequest(
  resources: readonly vscode.Uri[],
  direction: ConversionDirection,
  autoApproveOverwrite?: boolean
): ConversionRequest {
  const preferences = createConversionPreferences();
  if (typeof autoApproveOverwrite === "boolean") {
    preferences.autoApproveOverwrite = autoApproveOverwrite;
  }

  return {
    sessionId: randomUUID(),
    direction,
    operation: "explorer-items",
    targets: resources.map(resource => ({
      targetId: randomUUID(),
      targetType: "file-item",
      sourcePath: resource.fsPath,
      sourceText: null,
      workspaceContext: vscode.workspace.getWorkspaceFolder(resource)?.uri.fsPath ?? path.dirname(resource.fsPath),
      selectedSpan: null
    })),
    preferences
  };
}

function requiresOverwriteApproval(response: ConversionResponse): boolean {
  return response.outcomes.some(outcome =>
    outcome.message === overwriteApprovalMessage ||
    outcome.warnings.includes(overwriteApprovalMessage));
}

function collectOutputPaths(outcomes: readonly ConversionOutcome[]): string[] {
  const seen = new Set<string>();
  const outputPaths: string[] = [];
  for (const outcome of outcomes) {
    for (const outputPath of outcome.outputPaths) {
      const key = outputPath.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        outputPaths.push(outputPath);
      }
    }
  }

  return outputPaths;
}

async function confirmOverwrite(outputPaths: readonly string[]): Promise<boolean> {
  const detail = outputPaths.slice(0, 20).join("\n");
  const message = `The conversion will overwrite ${outputPaths.length} existing output(s).`;
  const selection = await vscode.window.showWarningMessage(
    message,
    {
      modal: true,
      detail
    },
    "Convert"
  );

  return selection === "Convert";
}

async function executeWorkspaceRequest(
  workerClient: WorkerClient,
  resources: readonly vscode.Uri[],
  direction: ConversionDirection
): Promise<void> {
  let request = createRequest(resources, direction);
  let response: ConversionResponse;

  try {
    response = await workerClient.execute(request);
  } catch (error) {
    showConversionFailure(error);
    return;
  }

  if (requiresOverwriteApproval(response)) {
    const approved = await confirmOverwrite(collectOutputPaths(response.outcomes));
    if (!approved) {
      return;
    }

    request = createRequest(resources, direction, true);
    try {
      response = await workerClient.execute(request);
    } catch (error) {
      showConversionFailure(error);
      return;
    }
  }

  const failures = response.outcomes.flatMap(outcome => outcome.errors);
  if (failures.length > 0 && response.summary.successCount === 0 && response.summary.warningCount === 0) {
    showConversionFailure(failures.join("\n"));
    return;
  }

  showConversionSummary(response.summary);
}

function showNoSelectionMessage(): void {
  void vscode.window.showWarningMessage("Select supported source files before running Code Converter.");
}

export function createConvertExplorerItemsCommand(
  workerClient: WorkerClient,
  direction: ConversionDirection
): (resource?: vscode.Uri, resources?: readonly vscode.Uri[]) => Promise<void> {
  return async (resource?: vscode.Uri, resources?: readonly vscode.Uri[]) => {
    const supportedResources = getSupportedResources(resource, resources, direction);
    if (supportedResources.length === 0) {
      showNoSelectionMessage();
      return;
    }

    await executeWorkspaceRequest(workerClient, supportedResources, direction);
  };
}
