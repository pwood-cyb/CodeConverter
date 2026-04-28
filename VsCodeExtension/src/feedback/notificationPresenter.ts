import * as vscode from "vscode";
import { appendOutputMessage } from "./outputChannel";

export function showConversionFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  appendOutputMessage(`Error: ${message}`);
  void vscode.window.showErrorMessage(`Code Converter failed: ${message}`);
}

export function showConversionWarning(message: string): void {
  appendOutputMessage(`Warning: ${message}`);
  void vscode.window.showWarningMessage(message);
}

export function showConversionCanceled(message = "Canceled the active conversion session."): void {
  appendOutputMessage(message);
  void vscode.window.showInformationMessage(message);
}
