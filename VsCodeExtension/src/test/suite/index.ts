import * as path from "node:path";
import Mocha from "mocha";

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 30000
  });

  for (const file of [
    "extensionHost.test.js",
    "editorConversion.test.js",
    "workspaceConversion.test.js",
    "safetyAndFeedback.test.js",
    "installValidation.test.js",
    "parityRegression.test.js",
    "workerPackaging.test.js"
  ]) {
    mocha.addFile(path.resolve(__dirname, file));
  }

  await new Promise<void>((resolve, reject) => {
    mocha.run(failures => {
      if (failures > 0) {
        reject(new Error(`${failures} VS Code test(s) failed.`));
        return;
      }

      resolve();
    });
  });
}

if (require.main === module) {
  void run();
}
