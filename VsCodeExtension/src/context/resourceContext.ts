import * as path from "node:path";

const sourceExtensions = new Set([".cs", ".vb"]);

export function isSupportedSourceFile(resourcePath: string): boolean {
  return sourceExtensions.has(path.extname(resourcePath).toLowerCase());
}

export function isVisualBasicPath(resourcePath: string): boolean {
  return path.extname(resourcePath).toLowerCase() === ".vb";
}

export function isCSharpPath(resourcePath: string): boolean {
  return path.extname(resourcePath).toLowerCase() === ".cs";
}
