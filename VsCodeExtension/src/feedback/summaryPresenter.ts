import * as vscode from "vscode";
import { ConversionSummary } from "../worker/protocol";

export function showConversionSummary(summary: ConversionSummary): void {
  void vscode.window.showInformationMessage(
    `Converted ${summary.successCount} target(s), ${summary.warningCount} warning target(s), ${summary.failureCount} failed target(s), ${summary.canceledCount} canceled target(s).`
  );
}
