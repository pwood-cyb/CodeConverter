using ICSharpCode.CodeConverter.Common;
using Microsoft.CodeAnalysis;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

using Contracts;

public sealed class DocumentConversionService
{
    public async Task<IReadOnlyList<ConversionOutcomeDto>> ConvertAsync(ConversionRequest request, CancellationToken cancellationToken)
    {
        var outcomes = new List<ConversionOutcomeDto>();
        foreach (var target in request.Targets) {
            outcomes.Add(await ConvertTargetAsync(request.Direction, target, cancellationToken));
        }

        return outcomes;
    }

    public async Task<ConversionOutcomeDto> ConvertTargetAsync(string direction, ConversionTargetDto target, CancellationToken cancellationToken)
    {
        return await ConvertTargetInternalAsync(direction, target, cancellationToken);
    }

    private static async Task<ConversionOutcomeDto> ConvertTargetInternalAsync(string direction, ConversionTargetDto target, CancellationToken cancellationToken)
    {
        try {
            var sourceText = await GetSourceTextAsync(target, cancellationToken);
            if (string.IsNullOrWhiteSpace(sourceText)) {
                return Failure(target.TargetId, "No source text was provided for conversion.");
            }

            var code = CreateCodeWithOptions(direction, sourceText);
            var result = await CodeConverter.ConvertAsync(code, cancellationToken);
            var warnings = (result.Exceptions ?? Array.Empty<string>()).Where(e => !string.IsNullOrWhiteSpace(e)).ToArray();
            if (!result.Success || string.IsNullOrWhiteSpace(result.ConvertedCode)) {
                return new ConversionOutcomeDto
                {
                    TargetId = target.TargetId,
                    Status = "failure",
                    Errors = warnings.Length > 0 ? warnings : new[] { "Conversion failed." },
                    Message = "Conversion failed."
                };
            }

            return new ConversionOutcomeDto
            {
                TargetId = target.TargetId,
                Status = warnings.Length > 0 ? "warning" : "success",
                ConvertedText = result.ConvertedCode,
                Warnings = warnings,
                Message = warnings.Length > 0 ? "Conversion completed with warnings." : "Conversion completed."
            };
        } catch (Exception ex) {
            return Failure(target.TargetId, ex.Message);
        }
    }

    private static async Task<string?> GetSourceTextAsync(ConversionTargetDto target, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(target.SourceText)) {
            return target.SourceText;
        }

        if (!string.IsNullOrWhiteSpace(target.SourcePath) && File.Exists(target.SourcePath)) {
            return await File.ReadAllTextAsync(target.SourcePath, cancellationToken);
        }

        return null;
    }

    private static CodeWithOptions CreateCodeWithOptions(string direction, string sourceText)
    {
        var code = new CodeWithOptions(sourceText).WithTypeReferences();
        return direction switch
        {
            "vb-to-cs" => code.SetFromLanguage(LanguageNames.VisualBasic).SetToLanguage(LanguageNames.CSharp),
            "cs-to-vb" => code.SetFromLanguage(LanguageNames.CSharp).SetToLanguage(LanguageNames.VisualBasic),
            _ => throw new NotSupportedException($"Unsupported conversion direction '{direction}'.")
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
}
