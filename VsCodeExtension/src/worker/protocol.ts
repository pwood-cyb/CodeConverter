export interface SelectedSpan {
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
}

export interface ConversionTarget {
  targetId: string;
  targetType: "selected-text" | "document" | "file-item" | "project" | "clipboard";
  sourcePath: string | null;
  selectedSpan: SelectedSpan | null;
  sourceText: string | null;
  workspaceContext: string | null;
}

export interface ConversionPreferences {
  copySingleResultToClipboard: boolean;
  autoApproveOverwrite: boolean;
  createBackups: boolean;
  formattingTimeoutMinutes: number;
  bypassAssemblyLoadingErrors: boolean;
}

export interface ConversionRequest {
  sessionId: string;
  direction: "vb-to-cs" | "cs-to-vb";
  operation: "selection" | "document" | "explorer-items" | "project" | "paste";
  targets: ConversionTarget[];
  preferences: ConversionPreferences;
}

export interface ConversionSummary {
  successCount: number;
  warningCount: number;
  failureCount: number;
  canceledCount: number;
}

export interface ConversionOutcome {
  targetId: string;
  status: "success" | "warning" | "failure" | "canceled";
  outputPaths: string[];
  convertedText: string | null;
  warnings: string[];
  errors: string[];
  message: string;
}

export interface ConversionResponse {
  sessionId: string;
  status: "completed" | "failed" | "canceled";
  summary: ConversionSummary;
  outcomes: ConversionOutcome[];
}
