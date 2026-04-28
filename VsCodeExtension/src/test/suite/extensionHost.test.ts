import * as assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Extension activation", () => {
  test("registers the expected command surface", async () => {
    const commands = await vscode.commands.getCommands(true);

    for (const commandId of [
      "codeconverter.convertSelection.vbToCs",
      "codeconverter.convertSelection.csToVb",
      "codeconverter.convertDocument.vbToCs",
      "codeconverter.convertDocument.csToVb",
      "codeconverter.convertExplorerItems.vbToCs",
      "codeconverter.convertExplorerItems.csToVb",
      "codeconverter.pasteAsCs",
      "codeconverter.pasteAsVb",
      "codeconverter.cancelConversion"
    ]) {
      assert.ok(commands.includes(commandId), `Expected command ${commandId} to be registered.`);
    }

    for (const commandId of [
      "codeconverter.convertProject.vbToCs",
      "codeconverter.convertProject.csToVb"
    ]) {
      assert.ok(!commands.includes(commandId), `Did not expect command ${commandId} to be registered.`);
    }
  });
});
