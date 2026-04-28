import * as vscode from "vscode";
import { createCancelConversionCommand } from "./cancelConversionCommand";
import {
  createConvertDocumentCommand,
  createConvertSelectionCommand
} from "./editorCommands";
import { createPasteCommand } from "./pasteCommands";
import {
  createConvertExplorerItemsCommand
} from "./workspaceCommands";
import { SessionState } from "../worker/sessionState";
import { WorkerClient } from "../worker/workerClient";

export const commandIds = {
  convertSelectionVbToCs: "codeconverter.convertSelection.vbToCs",
  convertSelectionCsToVb: "codeconverter.convertSelection.csToVb",
  convertDocumentVbToCs: "codeconverter.convertDocument.vbToCs",
  convertDocumentCsToVb: "codeconverter.convertDocument.csToVb",
  convertExplorerItemsVbToCs: "codeconverter.convertExplorerItems.vbToCs",
  convertExplorerItemsCsToVb: "codeconverter.convertExplorerItems.csToVb",
  pasteAsCs: "codeconverter.pasteAsCs",
  pasteAsVb: "codeconverter.pasteAsVb",
  cancelConversion: "codeconverter.cancelConversion"
} as const;

export type ConversionDirection = "vb-to-cs" | "cs-to-vb";

export function registerCommands(
  context: vscode.ExtensionContext,
  workerClient: WorkerClient,
  sessionState: SessionState
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand(
      commandIds.convertSelectionVbToCs,
      createConvertSelectionCommand(context, workerClient, "vb-to-cs")
    ),
    vscode.commands.registerCommand(
      commandIds.convertSelectionCsToVb,
      createConvertSelectionCommand(context, workerClient, "cs-to-vb")
    ),
    vscode.commands.registerCommand(
      commandIds.convertDocumentVbToCs,
      createConvertDocumentCommand(context, workerClient, "vb-to-cs")
    ),
    vscode.commands.registerCommand(
      commandIds.convertDocumentCsToVb,
      createConvertDocumentCommand(context, workerClient, "cs-to-vb")
    ),
    vscode.commands.registerCommand(
      commandIds.pasteAsCs,
      createPasteCommand(context, workerClient, "vb-to-cs")
    ),
    vscode.commands.registerCommand(
      commandIds.pasteAsVb,
      createPasteCommand(context, workerClient, "cs-to-vb")
    ),
    vscode.commands.registerCommand(
      commandIds.convertExplorerItemsVbToCs,
      createConvertExplorerItemsCommand(workerClient, "vb-to-cs")
    ),
    vscode.commands.registerCommand(
      commandIds.convertExplorerItemsCsToVb,
      createConvertExplorerItemsCommand(workerClient, "cs-to-vb")
    ),
    vscode.commands.registerCommand(
      commandIds.cancelConversion,
      createCancelConversionCommand(sessionState)
    )
  ];
}
