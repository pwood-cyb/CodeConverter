namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionOutcomeDto
{
    public string TargetId { get; set; } = "";
    public string Status { get; set; } = "";
    public IReadOnlyList<string> OutputPaths { get; set; } = Array.Empty<string>();
    public string? ConvertedText { get; set; }
    public IReadOnlyList<string> Warnings { get; set; } = Array.Empty<string>();
    public IReadOnlyList<string> Errors { get; set; } = Array.Empty<string>();
    public string Message { get; set; } = "";
}
