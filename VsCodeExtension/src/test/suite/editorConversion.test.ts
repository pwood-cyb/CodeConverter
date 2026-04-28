import * as assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Editor conversion", function () {
  this.timeout(30000);

  test("converts selected VB.NET code into a C# preview document", async function () {
    const document = await vscode.workspace.openTextDocument({
      language: "vb",
      content: "Class TestClass\nEnd Class"
    });
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(0, 0, 1, 9);

    await vscode.commands.executeCommand("codeconverter.convertSelection.vbToCs");

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, "Expected a converted editor to be shown.");
    assert.equal(activeEditor?.document.languageId, "csharp");
    assert.match(activeEditor?.document.getText() ?? "", /class TestClass/i);
  });
});
