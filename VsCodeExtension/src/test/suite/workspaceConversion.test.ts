import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

function repoRoot(): string {
  return path.resolve(__dirname, "../../../../");
}

function sourceFixtureRoot(): string {
  return path.join(repoRoot(), "Tests", "TestData", "MultiFileCharacterization", "SourceFiles");
}

function createTempWorkspace(): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-workspace-"));
  fs.cpSync(sourceFixtureRoot(), tempRoot, { recursive: true });
  return tempRoot;
}

suite("Workspace conversion", function () {
  this.timeout(30000);

  const tempDirectories: string[] = [];

  teardown(async function () {
    await vscode.workspace.getConfiguration("codeConverter").update("autoApproveOverwrite", false, vscode.ConfigurationTarget.Global);
    while (tempDirectories.length > 0) {
      fs.rmSync(tempDirectories.pop()!, { recursive: true, force: true });
    }
  });

  test("converts selected Explorer files into written outputs", async function () {
    const workspaceRoot = createTempWorkspace();
    tempDirectories.push(workspaceRoot);
    const sourceFile = vscode.Uri.file(path.join(workspaceRoot, "ConsoleApp2", "AnotherSharedNamespaceClass.cs"));

    await vscode.commands.executeCommand("codeconverter.convertExplorerItems.csToVb", sourceFile, [sourceFile]);

    const convertedFile = path.join(workspaceRoot, "ConsoleApp2", "AnotherSharedNamespaceClass.vb");
    assert.ok(fs.existsSync(convertedFile), `Expected converted file ${convertedFile} to exist.`);
    assert.match(fs.readFileSync(convertedFile, "utf8"), /Class AnotherSharedNamespaceClass/i);
  });

});
