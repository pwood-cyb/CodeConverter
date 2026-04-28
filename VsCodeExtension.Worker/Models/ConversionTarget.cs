namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Models;

public sealed class ConversionTarget
{
    public string TargetId { get; init; } = "";
    public string TargetType { get; init; } = "";
    public string? SourcePath { get; init; }
    public string? SourceText { get; init; }
}
