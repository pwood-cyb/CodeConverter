using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ICSharpCode.CodeConverter;
using ICSharpCode.CodeConverter.Common;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

public sealed class WorkspaceConversionService
{
    private readonly DocumentConversionService _documentConversionService;
    private readonly WorkspaceWriteCoordinator _writeCoordinator;

    public WorkspaceConversionService(
        DocumentConversionService documentConversionService,
        WorkspaceWriteCoordinator? writeCoordinator = null)
    {
        _documentConversionService = documentConversionService;
        _writeCoordinator = writeCoordinator ?? new WorkspaceWriteCoordinator();
    }

    public async Task<IReadOnlyList<ConversionOutcomeDto>> ConvertAsync(
        ConversionRequest request,
        CancellationToken cancellationToken)
    {
        var outcomes = new List<ConversionOutcomeDto>();
        foreach (var target in request.Targets) {
            outcomes.Add(request.Operation switch
            {
                "explorer-items" => await ConvertWorkspaceFileAsync(request.Direction, target, request.Preferences, cancellationToken),
                // Keep SDK-driven project conversion out of the VS Code package until it can run without an external dotnet toolchain.
                "project" => Failure(target.TargetId, "Project and solution conversion is not supported in the VS Code extension."),
                _ => Failure(target.TargetId, $"The '{request.Operation}' operation is not supported for workspace conversion.")
            });
        }

        return outcomes;
    }

    private async Task<ConversionOutcomeDto> ConvertWorkspaceFileAsync(
        string direction,
        ConversionTargetDto target,
        ConversionPreferenceDto preferences,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(target.SourcePath) || !File.Exists(target.SourcePath)) {
            return Failure(target.TargetId, "The selected workspace file could not be found.");
        }

        var documentOutcome = await _documentConversionService.ConvertTargetAsync(direction, target, cancellationToken);
        if (documentOutcome.Status == "failure" || string.IsNullOrWhiteSpace(documentOutcome.ConvertedText)) {
            return documentOutcome;
        }

        var output = new PreparedWorkspaceOutput(
            target.SourcePath,
            TogglePathExtension(target.SourcePath),
            documentOutcome.ConvertedText,
            documentOutcome.Warnings,
            documentOutcome.Errors);
        var writeResult = await _writeCoordinator.WriteAsync(new[] { output }, preferences, cancellationToken);
        if (writeResult.RequiresOverwriteApproval) {
            return new ConversionOutcomeDto
            {
                TargetId = target.TargetId,
                Status = "warning",
                OutputPaths = writeResult.OutputPaths,
                Warnings = new[] { WorkspaceWriteCoordinator.OverwriteApprovalMessage },
                Message = WorkspaceWriteCoordinator.OverwriteApprovalMessage
            };
        }

        return new ConversionOutcomeDto
        {
            TargetId = target.TargetId,
            Status = documentOutcome.Warnings.Count > 0 ? "warning" : "success",
            OutputPaths = writeResult.OutputPaths,
            Warnings = documentOutcome.Warnings,
            Errors = documentOutcome.Errors,
            Message = $"Wrote {writeResult.WrittenCount} converted file(s)."
        };
    }

    private static ConversionOutcomeDto Failure(string targetId, string error)
    {
        return new ConversionOutcomeDto
        {
            TargetId = targetId,
            Status = "failure",
            Errors = new[] { error },
            Message = "Conversion failed."
        };
    }

    private static string TogglePathExtension(string filePath)
    {
        return Path.ChangeExtension(filePath, Path.GetExtension(filePath).ToLowerInvariant() switch
        {
            ".csproj" => ".vbproj",
            ".vbproj" => ".csproj",
            ".cs" => ".vb",
            ".vb" or ".bas" or ".cls" or ".ctl" or ".dob" or ".dsr" or ".frm" or ".pag" => ".cs",
            _ => Path.GetExtension(filePath)
        });
    }
}
