import * as vscode from "vscode";
import { registerCommands } from "./commands/registerCommands";
import { WorkerClient } from "./worker/workerClient";
import { SessionState } from "./worker/sessionState";
import { getOutputChannel } from "./feedback/outputChannel";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = getOutputChannel();
  const sessionState = new SessionState(outputChannel);
  const workerClient = new WorkerClient(context, sessionState, outputChannel);

  context.subscriptions.push(outputChannel);
  context.subscriptions.push(sessionState);
  context.subscriptions.push(workerClient);
  context.subscriptions.push(...registerCommands(context, workerClient, sessionState));
}

export function deactivate(): void {
  // VS Code disposes subscriptions registered during activation.
}
