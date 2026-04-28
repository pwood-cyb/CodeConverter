import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(extensionRoot, "..");
const logPath = path.join(extensionRoot, "package-vsix.log");
const workerOutputDirectory = path.join(extensionRoot, "worker");

await main();

async function main() {
  fs.writeFileSync(logPath, "");

  try {
    await runStep(
      "Publish worker",
      dotnetCommand(),
      [
        "publish",
        path.join(repositoryRoot, "VsCodeExtension.Worker", "VsCodeExtension.Worker.csproj"),
        "-c",
        "Release",
        "-f",
        "net8.0",
        "-o",
        workerOutputDirectory,
        "-p:GeneratePackageOnBuild=false",
        "-v",
        "minimal"
      ],
      repositoryRoot
    );

    await runStep(
      "Validate worker payload",
      nodeCommand(),
      [path.join(scriptDirectory, "validatePackage.mjs")],
      extensionRoot
    );

    await runStep(
      "Package VSIX",
      resolveVsceCommand(),
      ["package"],
      extensionRoot
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\nVSIX packaging failed. See ${logPath} for the full log.\n`);
    process.stderr.write(`${message}\n`);
    appendLog(`\nERROR: ${message}\n`);
    process.exitCode = 1;
  }
}

function dotnetCommand() {
  if (process.platform === "win32") {
    return process.env.DOTNET_EXE_PATH ?? "C:\\Program Files\\dotnet\\dotnet.exe";
  }

  return "dotnet";
}

function nodeCommand() {
  return process.execPath;
}

function resolveVsceCommand() {
  if (process.platform === "win32") {
    const exePath = path.join(extensionRoot, "node_modules", ".bin", "vsce.exe");
    if (fs.existsSync(exePath)) {
      return exePath;
    }

    return path.join(extensionRoot, "node_modules", ".bin", "vsce.cmd");
  }

  return path.join(extensionRoot, "node_modules", ".bin", "vsce");
}

async function runStep(stepName, command, args, cwd) {
  if (!fs.existsSync(path.dirname(logPath))) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
  }

  appendLog(`\n=== ${stepName} ===\n`);
  appendLog(`Command: ${command} ${args.join(" ")}\n`);

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stdout.on("data", chunk => {
      process.stdout.write(chunk);
      appendLog(chunk.toString());
    });

    child.stderr.on("data", chunk => {
      process.stderr.write(chunk);
      appendLog(chunk.toString());
    });

    child.on("error", error => {
      reject(new Error(`${stepName} could not start: ${error.message}`));
    });

    child.on("close", code => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${stepName} failed with exit code ${code}.`));
    });
  });
}

function appendLog(text) {
  fs.appendFileSync(logPath, text);
}
