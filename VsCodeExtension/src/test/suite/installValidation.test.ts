import * as assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Install validation", () => {
  test("activates the extension and exposes the expected configuration surface", async () => {
    const extension = vscode.extensions.getExtension("icsharpcode.codeconverter-vscode");
    assert.ok(extension, "Expected the Code Converter extension to be available.");

    await extension!.activate();

    const configuration = vscode.workspace.getConfiguration("codeConverter");
    assert.equal(configuration.get("copySingleResultToClipboard"), false);
    assert.equal(configuration.get("autoApproveOverwrite"), false);
    assert.equal(configuration.get("createBackups"), true);
    assert.equal(configuration.get("formattingTimeoutMinutes"), 15);
  });
});
