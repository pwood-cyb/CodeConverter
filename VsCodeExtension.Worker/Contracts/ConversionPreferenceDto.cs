namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class ConversionPreferenceDto
{
    public bool CopySingleResultToClipboard { get; set; }
    public bool AutoApproveOverwrite { get; set; }
    public bool CreateBackups { get; set; } = true;
    public int FormattingTimeoutMinutes { get; set; } = 15;
    public bool BypassAssemblyLoadingErrors { get; set; }
}
