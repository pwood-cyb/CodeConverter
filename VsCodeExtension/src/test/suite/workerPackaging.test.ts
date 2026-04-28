import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  resolveWorkerLaunchConfiguration,
  workerAssemblyFileName,
  workerExecutableFileName
} from "../../worker/workerClient";

suite("Worker packaging", () => {
  test("prefers packaged worker assets when present", () => {
    const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-packaged-worker-"));
    const workerDirectory = path.join(extensionRoot, "worker");
    fs.mkdirSync(workerDirectory, { recursive: true });

    const packagedWorker = path.join(workerDirectory, workerExecutableFileName);
    fs.writeFileSync(packagedWorker, "");

    try {
      const launchConfiguration = resolveWorkerLaunchConfiguration(extensionRoot);
      assert.equal(launchConfiguration.command, packagedWorker);
      assert.equal(launchConfiguration.workerAssemblyPath, packagedWorker);
      assert.deepEqual(launchConfiguration.args, []);
      assert.equal(launchConfiguration.cwd, workerDirectory);
    } finally {
      fs.rmSync(extensionRoot, { recursive: true, force: true });
    }
  });

  test("requires a packaged worker executable on Windows", () => {
    const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-packaged-worker-dll-"));
    const workerDirectory = path.join(extensionRoot, "worker");
    fs.mkdirSync(workerDirectory, { recursive: true });

    const packagedWorker = path.join(workerDirectory, workerAssemblyFileName);
    fs.writeFileSync(packagedWorker, "");

    try {
      assert.throws(
        () => resolveWorkerLaunchConfiguration(extensionRoot),
        /missing ICSharpCode\.CodeConverter\.VsCodeExtension\.Worker\.exe/i
      );
    } finally {
      fs.rmSync(extensionRoot, { recursive: true, force: true });
    }
  });

  test("falls back to development worker output when packaged assets are absent", () => {
    const extensionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codeconverter-vscode-development-worker-"));
    const devExtensionRoot = path.join(extensionRoot, "VsCodeExtension");
    const devWorkerDirectory = path.join(extensionRoot, "VsCodeExtension.Worker", "bin", "Debug", "net8.0");
    fs.mkdirSync(devExtensionRoot, { recursive: true });
    fs.mkdirSync(devWorkerDirectory, { recursive: true });

    const developmentWorker = path.join(devWorkerDirectory, workerExecutableFileName);
    fs.writeFileSync(developmentWorker, "");

    try {
      const launchConfiguration = resolveWorkerLaunchConfiguration(devExtensionRoot);
      assert.equal(launchConfiguration.command, developmentWorker);
      assert.equal(launchConfiguration.workerAssemblyPath, developmentWorker);
      assert.deepEqual(launchConfiguration.args, []);
      assert.equal(launchConfiguration.cwd, devWorkerDirectory);
    } finally {
      fs.rmSync(extensionRoot, { recursive: true, force: true });
    }
  });
});
