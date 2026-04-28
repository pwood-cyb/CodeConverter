import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Code Converter");
  }

  return outputChannel;
}

export function appendOutputMessage(message: string): void {
  getOutputChannel().appendLine(message);
}
