import path from "node:path";
import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/**/*.test.js",
  workspaceFolder: path.resolve("src/test/fixtures"),
  extensionDevelopmentPath: path.resolve(".")
});
