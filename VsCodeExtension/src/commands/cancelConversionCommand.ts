import * as vscode from "vscode";
import { SessionState } from "../worker/sessionState";

export function createCancelConversionCommand(sessionState: SessionState): () => Thenable<void> {
  return () => sessionState.cancelActiveSession();
}
