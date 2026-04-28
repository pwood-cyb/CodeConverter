using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;
using Xunit;

namespace ICSharpCode.CodeConverter.Tests.VsCodeExtensionWorker;

public sealed class WorkspaceConversionWorkerTests : IDisposable
{
    private readonly string _tempRoot = Path.Combine(Path.GetTempPath(), "CodeConverter.VsCodeExtensionWorkerTests", Guid.NewGuid().ToString("N"));

    [Fact]
    public async Task Converts_selected_workspace_file_and_writes_output()
    {
        var sourceFile = CopyFileToTemp(Path.Combine(GetSourceFixtureRoot(), "ConsoleApp2", "AnotherSharedNamespaceClass.cs"));
        var runner = CreateRunner();
        var request = new ConversionRequest
        {
            SessionId = "workspace-file-session",
            Direction = "cs-to-vb",
            Operation = "explorer-items",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "file-target-1",
                    TargetType = "file-item",
                    SourcePath = sourceFile,
                    WorkspaceContext = Path.GetDirectoryName(sourceFile)
                }
            },
            Preferences = new ConversionPreferenceDto
            {
                AutoApproveOverwrite = true,
                CreateBackups = true
            }
        };

        var response = await runner.RunAsync(request, CancellationToken.None);

        var outputPath = Path.ChangeExtension(sourceFile, ".vb");
        Assert.Equal("completed", response.Status);
        Assert.Single(response.Outcomes);
        Assert.Equal("success", response.Outcomes[0].Status);
        Assert.Contains(outputPath, response.Outcomes[0].OutputPaths, StringComparer.OrdinalIgnoreCase);
        Assert.True(File.Exists(outputPath), $"Expected converted file {outputPath} to be written.");
        Assert.Contains("Class AnotherSharedNamespaceClass", File.ReadAllText(outputPath), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Rejects_project_conversion_requests_for_vscode_extension_scope()
    {
        var workspaceRoot = CopyDirectoryToTemp(GetSourceFixtureRoot());
        var solutionPath = Path.Combine(workspaceRoot, "CharacterizationTestSolution.sln");
        var runner = CreateRunner();
        var request = new ConversionRequest
        {
            SessionId = "workspace-project-session",
            Direction = "cs-to-vb",
            Operation = "project",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "project-target-1",
                    TargetType = "project",
                    SourcePath = solutionPath,
                    WorkspaceContext = workspaceRoot
                }
            },
            Preferences = new ConversionPreferenceDto
            {
                AutoApproveOverwrite = true,
                CreateBackups = true
            }
        };

        var response = await runner.RunAsync(request, CancellationToken.None);

        Assert.Equal("failed", response.Status);
        Assert.Single(response.Outcomes);
        Assert.Equal("failure", response.Outcomes[0].Status);
        Assert.Contains("not supported", response.Outcomes[0].Errors[0], StringComparison.OrdinalIgnoreCase);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot)) {
            Directory.Delete(_tempRoot, true);
        }
    }

    private ConversionSessionRunner CreateRunner()
    {
        var documentConversionService = new DocumentConversionService();
        var workspaceConversionService = new WorkspaceConversionService(documentConversionService);
        return new ConversionSessionRunner(documentConversionService, workspaceConversionService, new CancellationRegistry());
    }

    private string CopyFileToTemp(string sourceFile)
    {
        var targetFile = Path.Combine(_tempRoot, Path.GetFileName(sourceFile));
        Directory.CreateDirectory(_tempRoot);
        File.Copy(sourceFile, targetFile, true);
        return targetFile;
    }

    private string CopyDirectoryToTemp(string sourceDirectory)
    {
        var targetDirectory = Path.Combine(_tempRoot, "SourceFiles");
        foreach (var directory in Directory.GetDirectories(sourceDirectory, "*", SearchOption.AllDirectories)) {
            Directory.CreateDirectory(directory.Replace(sourceDirectory, targetDirectory, StringComparison.OrdinalIgnoreCase));
        }

        foreach (var file in Directory.GetFiles(sourceDirectory, "*", SearchOption.AllDirectories)) {
            var targetFile = file.Replace(sourceDirectory, targetDirectory, StringComparison.OrdinalIgnoreCase);
            Directory.CreateDirectory(Path.GetDirectoryName(targetFile)!);
            File.Copy(file, targetFile, true);
        }

        return targetDirectory;
    }

    private static string GetSourceFixtureRoot()
    {
        return Path.Combine(TestConstants.GetTestDataDirectory(), "MultiFileCharacterization", "SourceFiles");
    }
}
