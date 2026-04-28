namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionSummaryDto
{
    public int SuccessCount { get; set; }
    public int WarningCount { get; set; }
    public int FailureCount { get; set; }
    public int CanceledCount { get; set; }
}
