using System;
using System.Threading;
using System.Threading.Tasks;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;
using Xunit;

namespace ICSharpCode.CodeConverter.Tests.VsCodeExtensionWorker;

public class DocumentConversionWorkerTests
{
    [Fact]
    public async Task Converts_vb_selection_to_csharp_text()
    {
        var service = new DocumentConversionService();
        var request = new ConversionRequest
        {
            SessionId = "session-1",
            Direction = "vb-to-cs",
            Operation = "selection",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "target-1",
                    TargetType = "selected-text",
                    SourceText = "Class TestClass\nEnd Class"
                }
            },
            Preferences = new ConversionPreferenceDto()
        };

        var outcomes = await service.ConvertAsync(request, CancellationToken.None);

        Assert.Single(outcomes);
        Assert.Equal("success", outcomes[0].Status);
        Assert.NotNull(outcomes[0].ConvertedText);
        Assert.Contains("class TestClass", outcomes[0].ConvertedText!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Converts_csharp_document_to_visual_basic_text()
    {
        var service = new DocumentConversionService();
        var request = new ConversionRequest
        {
            SessionId = "session-2",
            Direction = "cs-to-vb",
            Operation = "document",
            Targets = new[]
            {
                new ConversionTargetDto
                {
                    TargetId = "target-2",
                    TargetType = "document",
                    SourceText = "class TestClass { }"
                }
            },
            Preferences = new ConversionPreferenceDto()
        };

        var outcomes = await service.ConvertAsync(request, CancellationToken.None);

        Assert.Single(outcomes);
        Assert.Equal("success", outcomes[0].Status);
        Assert.NotNull(outcomes[0].ConvertedText);
        Assert.Contains("Class TestClass", outcomes[0].ConvertedText!, StringComparison.OrdinalIgnoreCase);
    }
}
