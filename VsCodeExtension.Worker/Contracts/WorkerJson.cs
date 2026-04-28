using System.Text.Json;
using System.Text.Json.Serialization;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;

public static class WorkerJson
{
    public static JsonSerializerOptions SerializerOptions { get; } = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };
}
