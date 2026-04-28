namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Models;

public sealed class ConversionSummary
{
    public int SuccessCount { get; set; }
    public int WarningCount { get; set; }
    public int FailureCount { get; set; }
    public int CanceledCount { get; set; }
}
