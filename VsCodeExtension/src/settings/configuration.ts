import * as vscode from "vscode";
import { ConversionDirection } from "../commands/registerCommands";
import { ConversionPreferences } from "../worker/protocol";

const configurationSection = "codeConverter";

export function createConversionPreferences(): ConversionPreferences {
  const configuration = vscode.workspace.getConfiguration(configurationSection);
  return {
    copySingleResultToClipboard: configuration.get<boolean>("copySingleResultToClipboard", false),
    autoApproveOverwrite: configuration.get<boolean>("autoApproveOverwrite", false),
    createBackups: configuration.get<boolean>("createBackups", true),
    formattingTimeoutMinutes: configuration.get<number>("formattingTimeoutMinutes", 15),
    bypassAssemblyLoadingErrors: configuration.get<boolean>("bypassAssemblyLoadingErrors", false)
  };
}

export function documentLanguageIdForDirection(direction: ConversionDirection): string {
  return direction === "vb-to-cs" ? "csharp" : "vb";
}
