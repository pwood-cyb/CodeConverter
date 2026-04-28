import * as vscode from "vscode";

export async function presentConvertedDocument(
  convertedText: string,
  languageId: string,
  warnings: string[],
  copyToClipboard: boolean
): Promise<void> {
  if (copyToClipboard) {
    await vscode.env.clipboard.writeText(convertedText);
  }

  const document = await vscode.workspace.openTextDocument({
    content: convertedText,
    language: languageId
  });
  await vscode.window.showTextDocument(document, { preview: false });

  if (warnings.length > 0) {
    void vscode.window.showWarningMessage(warnings.join("\n"));
  }
}
