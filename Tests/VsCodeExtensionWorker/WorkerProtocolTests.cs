using System.Text.Json;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using Xunit;

namespace ICSharpCode.CodeConverter.Tests.VsCodeExtensionWorker;

public class WorkerProtocolTests
{
    [Fact]
    public void Request_round_trips_with_web_json_contract()
    {
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
                    SourcePath = @"C:\temp\Test.vb",
                    SourceText = "Class TestClass\nEnd Class"
                }
            },
            Preferences = new ConversionPreferenceDto
            {
                CopySingleResultToClipboard = true,
                CreateBackups = true,
                FormattingTimeoutMinutes = 15
            }
        };

        var json = JsonSerializer.Serialize(request, WorkerJson.SerializerOptions);
        var roundTripped = JsonSerializer.Deserialize<ConversionRequest>(json, WorkerJson.SerializerOptions);

        Assert.NotNull(roundTripped);
        Assert.Equal(request.SessionId, roundTripped!.SessionId);
        Assert.Equal(request.Direction, roundTripped.Direction);
        Assert.Equal(request.Operation, roundTripped.Operation);
        Assert.Single(roundTripped.Targets);
        Assert.Equal("selected-text", roundTripped.Targets[0].TargetType);
    }
}
