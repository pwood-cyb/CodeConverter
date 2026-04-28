using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;
using Xunit;

namespace ICSharpCode.CodeConverter.Tests.VsCodeExtensionWorker;

public sealed class ConversionPreferenceAndCancellationTests : IDisposable
{
    private readonly string _tempRoot = Path.Combine(Path.GetTempPath(), "CodeConverter.VsCodeExtensionWorkerPreferences", Guid.NewGuid().ToString("N"));

    [Fact]
    public async Task Requires_overwrite_approval_before_replacing_existing_workspace_output()
    {
        var sourceFile = CopyFileToTemp(Path.Combine(GetSourceFixtureRoot(), "ConsoleApp2", "AnotherSharedNamespaceClass.cs"));
        var existingOutputPath = Path.ChangeExtension(sourceFile, ".vb");
        Directory.CreateDirectory(Path.GetDirectoryName(existingOutputPath)!);
        await File.WriteAllTextAsync(existingOutputPath, "original output");

        var response = await CreateRunner().RunAsync(new ConversionRequest
        {
            SessionId = "overwrite-preview-session",
            Direction = "cs-to-vb",
            Operation = "explorer-items",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "target-1",
                    TargetType = "file-item",
                    SourcePath = sourceFile,
                    WorkspaceContext = Path.GetDirectoryName(sourceFile)
                }
            },
            Preferences = new ConversionPreferenceDto
            {
                AutoApproveOverwrite = false,
                CreateBackups = true
            }
        }, CancellationToken.None);

        Assert.Equal("completed", response.Status);
        Assert.Single(response.Outcomes);
        Assert.Equal("warning", response.Outcomes[0].Status);
        Assert.Contains(WorkspaceWriteCoordinator.OverwriteApprovalMessage, response.Outcomes[0].Warnings);
        Assert.Equal("original output", await File.ReadAllTextAsync(existingOutputPath));
    }

    [Fact]
    public async Task Creates_backup_before_overwriting_existing_workspace_output()
    {
        var sourceFile = CopyFileToTemp(Path.Combine(GetSourceFixtureRoot(), "ConsoleApp2", "AnotherSharedNamespaceClass.cs"));
        var existingOutputPath = Path.ChangeExtension(sourceFile, ".vb");
        Directory.CreateDirectory(Path.GetDirectoryName(existingOutputPath)!);
        await File.WriteAllTextAsync(existingOutputPath, "original output");

        var response = await CreateRunner().RunAsync(new ConversionRequest
        {
            SessionId = "overwrite-approved-session",
            Direction = "cs-to-vb",
            Operation = "explorer-items",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "target-2",
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
        }, CancellationToken.None);

        Assert.Equal("completed", response.Status);
        Assert.Equal("success", response.Outcomes[0].Status);
        Assert.True(File.Exists(existingOutputPath + ".bak"));
        Assert.Equal("original output", await File.ReadAllTextAsync(existingOutputPath + ".bak"));
        Assert.Contains("Class AnotherSharedNamespaceClass", await File.ReadAllTextAsync(existingOutputPath), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Cancels_registered_sessions()
    {
        var registry = new CancellationRegistry();
        var token = registry.Register("cancel-session", CancellationToken.None);

        Assert.False(token.IsCancellationRequested);
        Assert.True(registry.TryCancel("cancel-session"));
        Assert.True(token.IsCancellationRequested);

        registry.Complete("cancel-session");
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

    private static string GetSourceFixtureRoot()
    {
        return Path.Combine(TestConstants.GetTestDataDirectory(), "MultiFileCharacterization", "SourceFiles");
    }
}
