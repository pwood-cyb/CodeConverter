namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Models;

public sealed class ConversionSession
{
    public string SessionId { get; init; } = "";
    public string Direction { get; init; } = "";
    public string Operation { get; init; } = "";
    public IReadOnlyList<ConversionTarget> Targets { get; init; } = Array.Empty<ConversionTarget>();
}
