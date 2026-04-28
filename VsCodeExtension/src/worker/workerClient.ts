import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import * as vscode from "vscode";
import { SessionState } from "./sessionState";
import { ConversionRequest, ConversionResponse, ConversionSummary } from "./protocol";

export const workerAssemblyFileName = "ICSharpCode.CodeConverter.VsCodeExtension.Worker.dll";
export const workerExecutableFileName = "ICSharpCode.CodeConverter.VsCodeExtension.Worker.exe";

interface WorkerLaunchConfiguration {
  command: string;
  args: string[];
  cwd: string;
  workerAssemblyPath: string;
}

export class WorkerClient implements vscode.Disposable {
  private readonly launchConfiguration: WorkerLaunchConfiguration;

  constructor(
    context: vscode.ExtensionContext,
    private readonly sessionState: SessionState,
    private readonly outputChannel: vscode.OutputChannel
  ) {
    this.launchConfiguration = resolveWorkerLaunchConfiguration(context.extensionUri.fsPath);
  }

  async execute(request: ConversionRequest): Promise<ConversionResponse> {
    return await new Promise<ConversionResponse>((resolve, reject) => {
      this.outputChannel.appendLine(`Launching worker command: ${this.launchConfiguration.command} ${this.launchConfiguration.args.join(" ")}`.trim());
      this.outputChannel.appendLine(`Worker working directory: ${this.launchConfiguration.cwd}`);
      const child = spawn(this.launchConfiguration.command, this.launchConfiguration.args, {
        cwd: this.launchConfiguration.cwd,
        stdio: "pipe"
      });

      this.sessionState.set(request.sessionId, child);
      this.outputChannel.appendLine(`Starting worker session ${request.sessionId}`);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", chunk => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", chunk => {
        stderr += chunk.toString();
      });

      child.on("error", error => {
        this.sessionState.complete(request.sessionId);
        reject(error);
      });

      child.on("close", code => {
        this.sessionState.complete(request.sessionId);
        if (this.sessionState.consumeCancellation(request.sessionId)) {
          resolve(createCanceledResponse(request));
          return;
        }

        if (code !== 0) {
          reject(new Error(stderr || `Worker exited with code ${code}`));
          return;
        }

        try {
          resolve(JSON.parse(stdout) as ConversionResponse);
        } catch (error) {
          reject(error);
        }
      });

      child.stdin.write(JSON.stringify(request));
      child.stdin.end();
    });
  }

  dispose(): void {
    // SessionState owns spawned child lifetime.
  }
}

export function resolveWorkerLaunchConfiguration(extensionPath: string): WorkerLaunchConfiguration {
  const packagedWorkerDirectory = path.join(extensionPath, "worker");
  if (fs.existsSync(packagedWorkerDirectory)) {
    const packagedLaunchConfiguration = createExecutableLaunchConfiguration(packagedWorkerDirectory);
    if (packagedLaunchConfiguration) {
      return packagedLaunchConfiguration;
    }

    if (fs.existsSync(path.join(packagedWorkerDirectory, workerAssemblyFileName))) {
      throw new Error(
        `The packaged worker is missing ${workerExecutableFileName}. Rebuild and reinstall the VSIX so the worker executable is included.`
      );
    }

    throw new Error(
      "The packaged worker payload could not be found. Rebuild and reinstall the VSIX so the worker executable is included."
    );
  }

  const developmentWorkerDirectory = resolveLatestWorkerBuildDirectory(extensionPath);
  if (developmentWorkerDirectory) {
    const developmentLaunchConfiguration = createWorkerLaunchConfiguration(developmentWorkerDirectory);
    if (developmentLaunchConfiguration) {
      return developmentLaunchConfiguration;
    }
  }

  throw new Error(
    "Could not locate the VS Code worker payload. Build VsCodeExtension.Worker or run the VSIX packaging stage first."
  );
}

function resolveLatestWorkerBuildDirectory(extensionPath: string): string | undefined {
  const buildRoot = path.resolve(extensionPath, "..", "VsCodeExtension.Worker", "bin");
  const candidateDirectories = ["Debug", "Release"]
    .flatMap(configuration => getWorkerBuildCandidates(path.join(buildRoot, configuration)));

  return candidateDirectories.find(candidateDirectory => createWorkerLaunchConfiguration(candidateDirectory) !== undefined);
}

function getWorkerBuildCandidates(configurationDirectory: string): string[] {
  if (!fs.existsSync(configurationDirectory)) {
    return [];
  }

  const targetFrameworkDirectories = fs.readdirSync(configurationDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(configurationDirectory, entry.name))
    .sort((left, right) => right.localeCompare(left));

  return [configurationDirectory, ...targetFrameworkDirectories];
}

function createWorkerLaunchConfiguration(workerDirectory: string): WorkerLaunchConfiguration | undefined {
  const executableLaunchConfiguration = createExecutableLaunchConfiguration(workerDirectory);
  if (executableLaunchConfiguration) {
    return executableLaunchConfiguration;
  }

  const workerAssemblyPath = path.join(workerDirectory, workerAssemblyFileName);
  if (fs.existsSync(workerAssemblyPath)) {
    return {
      command: "dotnet",
      args: [workerAssemblyPath],
      cwd: workerDirectory,
      workerAssemblyPath
    };
  }

  return undefined;
}

function createExecutableLaunchConfiguration(workerDirectory: string): WorkerLaunchConfiguration | undefined {
  const workerExecutablePath = path.join(workerDirectory, workerExecutableFileName);
  if (!fs.existsSync(workerExecutablePath)) {
    return undefined;
  }

  return {
    command: workerExecutablePath,
    args: [],
    cwd: workerDirectory,
    workerAssemblyPath: workerExecutablePath
  };
}

function createCanceledResponse(request: ConversionRequest): ConversionResponse {
  const summary: ConversionSummary = {
    successCount: 0,
    warningCount: 0,
    failureCount: 0,
    canceledCount: request.targets.length
  };

  return {
    sessionId: request.sessionId,
    status: "canceled",
    summary,
    outcomes: request.targets.map(target => ({
      targetId: target.targetId,
      status: "canceled",
      outputPaths: [],
      convertedText: null,
      warnings: [],
      errors: [],
      message: "Conversion canceled."
    }))
  };
}
