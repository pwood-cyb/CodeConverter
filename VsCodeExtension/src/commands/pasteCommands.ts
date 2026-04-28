import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import { ConversionDirection } from "./registerCommands";
import { createConversionPreferences } from "../settings/configuration";
import { showConversionFailure } from "../feedback/notificationPresenter";
import { ConversionRequest } from "../worker/protocol";
import { WorkerClient } from "../worker/workerClient";

export function createPasteCommand(
  _context: vscode.ExtensionContext,
  workerClient: WorkerClient,
  direction: ConversionDirection
): () => Promise<void> {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showWarningMessage("Open an editor before running paste-as conversion.");
      return;
    }

    const clipboardText = await vscode.env.clipboard.readText();
    if (!clipboardText.trim()) {
      void vscode.window.showWarningMessage("Clipboard is empty.");
      return;
    }

    const request: ConversionRequest = {
      sessionId: randomUUID(),
      direction,
      operation: "paste",
      targets: [
        {
          targetId: randomUUID(),
          targetType: "clipboard",
          sourcePath: editor.document.uri.fsPath,
          sourceText: clipboardText,
          workspaceContext: vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath ?? null,
          selectedSpan: null
        }
      ],
      preferences: createConversionPreferences()
    };

    try {
      const response = await workerClient.execute(request);
      const convertedText = response.outcomes[0]?.convertedText;
      if (!convertedText) {
        showConversionFailure(response.outcomes[0]?.errors?.join("\n") ?? "Paste conversion did not produce any code.");
        return;
      }

      await editor.edit(editBuilder => {
        editBuilder.replace(editor.selection, convertedText);
      });
    } catch (error) {
      showConversionFailure(error);
    }
  };
}
