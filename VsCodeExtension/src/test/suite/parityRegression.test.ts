import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

suite("Parity regression", function () {
  this.timeout(30000);

  const tempDirectories: string[] = [];

  teardown(function () {
    while (tempDirectories.length > 0) {
      fs.rmSync(tempDirectories.pop()!, { recursive: true, force: true });
    }
  });

  test("covers editor, paste, and workspace command surfaces in one smoke pass", async function () {
    const document = await vscode.workspace.openTextDocument({
      language: "vb",
      content: "Class SmokeTest\nEnd Class"
    });
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(0, 0, 1, 9);

    await vscode.commands.executeCommand("codeconverter.convertSelection.vbToCs");
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? "", /class SmokeTest/i);

    await vscode.env.clipboard.writeText("Class ClipboardSmoke\nEnd Class");
    await vscode.commands.executeCommand("codeconverter.pasteAsCs");
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? "", /class ClipboardSmoke/i);

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-parity-"));
    tempDirectories.push(tempRoot);
    const sourceFile = path.join(tempRoot, "ParityFile.cs");
    fs.writeFileSync(sourceFile, "class ParityFile { }", "utf8");

    const sourceUri = vscode.Uri.file(sourceFile);
    await vscode.commands.executeCommand("codeconverter.convertExplorerItems.csToVb", sourceUri, [sourceUri]);

    assert.ok(fs.existsSync(path.join(tempRoot, "ParityFile.vb")));
  });
});
