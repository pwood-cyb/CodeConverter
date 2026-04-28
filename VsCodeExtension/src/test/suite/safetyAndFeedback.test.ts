import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

function repoRoot(): string {
  return path.resolve(__dirname, "../../../../");
}

function sourceFixtureFile(relativePath: string): string {
  return path.join(repoRoot(), "Tests", "TestData", "MultiFileCharacterization", "SourceFiles", relativePath);
}

suite("Safety and feedback", function () {
  this.timeout(30000);

  const tempDirectories: string[] = [];

  teardown(async function () {
    await vscode.workspace.getConfiguration("codeConverter").update("copySingleResultToClipboard", false, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration("codeConverter").update("autoApproveOverwrite", false, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration("codeConverter").update("createBackups", true, vscode.ConfigurationTarget.Global);
    while (tempDirectories.length > 0) {
      fs.rmSync(tempDirectories.pop()!, { recursive: true, force: true });
    }
  });

  test("copies single-document conversion output to the clipboard when enabled", async function () {
    await vscode.workspace.getConfiguration("codeConverter").update("copySingleResultToClipboard", true, vscode.ConfigurationTarget.Global);
    const document = await vscode.workspace.openTextDocument({
      language: "vb",
      content: "Class ClipboardExample\nEnd Class"
    });
    await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand("codeconverter.convertDocument.vbToCs");

    const clipboardText = await vscode.env.clipboard.readText();
    assert.match(clipboardText, /class ClipboardExample/i);
  });

  test("creates backups when overwriting workspace outputs with auto-approval enabled", async function () {
    await vscode.workspace.getConfiguration("codeConverter").update("autoApproveOverwrite", true, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration("codeConverter").update("createBackups", true, vscode.ConfigurationTarget.Global);

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-safety-"));
    tempDirectories.push(tempRoot);
    const sourceFile = path.join(tempRoot, "AnotherSharedNamespaceClass.cs");
    const outputFile = path.join(tempRoot, "AnotherSharedNamespaceClass.vb");
    fs.copyFileSync(sourceFixtureFile(path.join("ConsoleApp2", "AnotherSharedNamespaceClass.cs")), sourceFile);
    fs.writeFileSync(outputFile, "original output", "utf8");

    const sourceUri = vscode.Uri.file(sourceFile);
    await vscode.commands.executeCommand("codeconverter.convertExplorerItems.csToVb", sourceUri, [sourceUri]);

    assert.ok(fs.existsSync(outputFile + ".bak"));
    assert.equal(fs.readFileSync(outputFile + ".bak", "utf8"), "original output");
    assert.match(fs.readFileSync(outputFile, "utf8"), /Class AnotherSharedNamespaceClass/i);
  });

  test("allows the cancel command to run when no session is active", async function () {
    await vscode.commands.executeCommand("codeconverter.cancelConversion");
  });
});
