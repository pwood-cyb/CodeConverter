using System.Collections.Generic;
using System.IO;
using System.Linq;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

public sealed class ConversionPreferenceService
{
    public bool RequiresOverwriteApproval(IEnumerable<string> outputPaths, ConversionPreferenceDto preferences)
    {
        return !preferences.AutoApproveOverwrite &&
               outputPaths.Any(path => File.Exists(path));
    }

    public bool ShouldCreateBackup(string outputPath, ConversionPreferenceDto preferences)
    {
        return preferences.CreateBackups && File.Exists(outputPath);
    }
}
