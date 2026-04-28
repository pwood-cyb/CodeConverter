namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionRequest
{
    public string SessionId { get; set; } = "";
    public string Direction { get; set; } = "";
    public string Operation { get; set; } = "";
    public IReadOnlyList<ConversionTargetDto> Targets { get; set; } = Array.Empty<ConversionTargetDto>();
    public ConversionPreferenceDto Preferences { get; set; } = new();
}
