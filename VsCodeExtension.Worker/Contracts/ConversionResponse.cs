namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionResponse
{
    public string SessionId { get; set; } = "";
    public string Status { get; set; } = "";
    public ConversionSummaryDto Summary { get; set; } = new();
    public IReadOnlyList<ConversionOutcomeDto> Outcomes { get; set; } = Array.Empty<ConversionOutcomeDto>();
}
