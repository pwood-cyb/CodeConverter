namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionTargetDto
{
    public string TargetId { get; set; } = "";
    public string TargetType { get; set; } = "";
    public string? SourcePath { get; set; }
    public SelectedSpanDto? SelectedSpan { get; set; }
    public string? SourceText { get; set; }
    public string? WorkspaceContext { get; set; }
}
