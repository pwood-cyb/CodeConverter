import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workerAssemblyFileName = "ICSharpCode.CodeConverter.VsCodeExtension.Worker.dll";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDirectory, "..");
const workerDirectory = path.join(extensionRoot, "worker");
const requiredFiles = [
  "ICSharpCode.CodeConverter.VsCodeExtension.Worker.exe",
  workerAssemblyFileName,
  "ICSharpCode.CodeConverter.VsCodeExtension.Worker.deps.json",
  "ICSharpCode.CodeConverter.VsCodeExtension.Worker.runtimeconfig.json"
];

for (const requiredFile of requiredFiles) {
  const requiredPath = path.join(workerDirectory, requiredFile);
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Missing packaged worker asset: ${requiredPath}`);
  }
}

const vscodeIgnorePath = path.join(extensionRoot, ".vscodeignore");
if (fs.existsSync(vscodeIgnorePath)) {
  const ignoredPatterns = fs
    .readFileSync(vscodeIgnorePath, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("#"));

  const excludesWorker = ignoredPatterns.some(pattern => /^worker(?:\/|\b)/.test(pattern));
  if (excludesWorker) {
    throw new Error("The current .vscodeignore excludes the packaged worker directory.");
  }
}

console.log(`Validated staged worker payload in ${workerDirectory}.`);
