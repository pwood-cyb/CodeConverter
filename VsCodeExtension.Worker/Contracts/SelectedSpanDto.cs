namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public sealed class SelectedSpanDto
{
    public int StartLine { get; set; }
    public int StartCharacter { get; set; }
    public int EndLine { get; set; }
    public int EndCharacter { get; set; }
}
