import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import { ConversionDirection } from "./registerCommands";
import {
  createConversionPreferences,
  documentLanguageIdForDirection
} from "../settings/configuration";
import { presentConvertedDocument } from "../feedback/editorResultPresenter";
import { showConversionFailure } from "../feedback/notificationPresenter";
import {
  ConversionRequest,
  ConversionResponse
} from "../worker/protocol";
import { WorkerClient } from "../worker/workerClient";

function requireActiveEditor(): vscode.TextEditor {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error("Open a C# or VB.NET document before running Code Converter.");
  }

  return editor;
}

function createRequest(
  editor: vscode.TextEditor,
  direction: ConversionDirection,
  operation: "selection" | "document",
  sourceText: string
): ConversionRequest {
  return {
    sessionId: randomUUID(),
    direction,
    operation,
    targets: [
      {
        targetId: randomUUID(),
        targetType: operation === "selection" ? "selected-text" : "document",
        sourcePath: editor.document.uri.fsPath,
        sourceText,
        workspaceContext: vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath ?? null,
        selectedSpan:
          operation === "selection"
            ? {
                startLine: editor.selection.start.line,
                startCharacter: editor.selection.start.character,
                endLine: editor.selection.end.line,
                endCharacter: editor.selection.end.character
              }
            : null
      }
    ],
    preferences: createConversionPreferences()
  };
}

async function runEditorRequest(
  workerClient: WorkerClient,
  request: ConversionRequest,
  languageId: string,
  copyToClipboard: boolean
): Promise<void> {
  let response: ConversionResponse;
  try {
    response = await workerClient.execute(request);
  } catch (error) {
    showConversionFailure(error);
    return;
  }

  const firstOutcome = response.outcomes[0];
  if (!firstOutcome?.convertedText) {
    showConversionFailure(firstOutcome?.errors?.join("\n") ?? "Conversion did not produce any code.");
    return;
  }

  await presentConvertedDocument(firstOutcome.convertedText, languageId, firstOutcome.warnings, copyToClipboard);
}

export function createConvertSelectionCommand(
  _context: vscode.ExtensionContext,
  workerClient: WorkerClient,
  direction: ConversionDirection
): () => Promise<void> {
  return async () => {
    const editor = requireActiveEditor();
    if (editor.selection.isEmpty) {
      void vscode.window.showWarningMessage("Select some code before running selection conversion.");
      return;
    }

    const sourceText = editor.document.getText(editor.selection);
    const preferences = createConversionPreferences();
    const request = createRequest(editor, direction, "selection", sourceText);
    request.preferences = preferences;
    await runEditorRequest(workerClient, request, documentLanguageIdForDirection(direction), preferences.copySingleResultToClipboard);
  };
}

export function createConvertDocumentCommand(
  _context: vscode.ExtensionContext,
  workerClient: WorkerClient,
  direction: ConversionDirection
): () => Promise<void> {
  return async () => {
    const editor = requireActiveEditor();
    const preferences = createConversionPreferences();
    const request = createRequest(editor, direction, "document", editor.document.getText());
    request.preferences = preferences;
    await runEditorRequest(workerClient, request, documentLanguageIdForDirection(direction), preferences.copySingleResultToClipboard);
  };
}
