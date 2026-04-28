import * as vscode from "vscode";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { showConversionCanceled } from "../feedback/notificationPresenter";

export class SessionState implements vscode.Disposable {
  private readonly sessions = new Map<string, ChildProcessWithoutNullStreams>();
  private readonly canceledSessions = new Set<string>();
  private activeSessionId: string | undefined;

  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  set(sessionId: string, process: ChildProcessWithoutNullStreams): void {
    this.activeSessionId = sessionId;
    this.canceledSessions.delete(sessionId);
    this.sessions.set(sessionId, process);
  }

  complete(sessionId: string): void {
    this.sessions.delete(sessionId);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = undefined;
    }
  }

  async cancelActiveSession(): Promise<void> {
    if (!this.activeSessionId) {
      void vscode.window.showInformationMessage("No conversion is currently running.");
      return;
    }

    this.outputChannel.appendLine(`Canceling conversion session ${this.activeSessionId}`);
    this.canceledSessions.add(this.activeSessionId);
    this.sessions.get(this.activeSessionId)?.kill();
    showConversionCanceled();
  }

  consumeCancellation(sessionId: string): boolean {
    const wasCanceled = this.canceledSessions.has(sessionId);
    this.canceledSessions.delete(sessionId);
    return wasCanceled;
  }

  dispose(): void {
    for (const process of this.sessions.values()) {
      process.kill();
    }
    this.sessions.clear();
  }
}
