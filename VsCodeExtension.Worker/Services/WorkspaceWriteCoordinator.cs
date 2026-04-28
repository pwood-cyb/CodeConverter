using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

internal sealed record PreparedWorkspaceOutput(
    string SourcePath,
    string OutputPath,
    string? ConvertedText,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<string> Errors);

internal sealed record WorkspaceWriteResult(
    IReadOnlyList<string> OutputPaths,
    bool RequiresOverwriteApproval,
    int WrittenCount);

public sealed class WorkspaceWriteCoordinator
{
    public const string OverwriteApprovalMessage = "Overwrite approval required before applying workspace changes.";
    private readonly ConversionPreferenceService _preferenceService;

    public WorkspaceWriteCoordinator(ConversionPreferenceService? preferenceService = null)
    {
        _preferenceService = preferenceService ?? new ConversionPreferenceService();
    }

    internal async Task<WorkspaceWriteResult> WriteAsync(
        IReadOnlyCollection<PreparedWorkspaceOutput> outputs,
        ConversionPreferenceDto preferences,
        CancellationToken cancellationToken)
    {
        var writableOutputs = outputs
            .Where(o => !string.IsNullOrWhiteSpace(o.ConvertedText) && string.IsNullOrWhiteSpace(string.Join("", o.Errors)))
            .ToArray();
        var outputPaths = writableOutputs
            .Select(o => o.OutputPath)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (_preferenceService.RequiresOverwriteApproval(outputPaths, preferences)) {
            return new WorkspaceWriteResult(outputPaths, true, 0);
        }

        foreach (var output in writableOutputs) {
            cancellationToken.ThrowIfCancellationRequested();

            var directory = Path.GetDirectoryName(output.OutputPath);
            if (!string.IsNullOrWhiteSpace(directory)) {
                Directory.CreateDirectory(directory);
            }

            if (_preferenceService.ShouldCreateBackup(output.OutputPath, preferences)) {
                File.Copy(output.OutputPath, output.OutputPath + ".bak", true);
            }

            await File.WriteAllTextAsync(output.OutputPath, output.ConvertedText!, cancellationToken);
        }

        return new WorkspaceWriteResult(outputPaths, false, writableOutputs.Length);
    }
}
