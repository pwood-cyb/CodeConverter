using System.Text.Json;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

var cancellationRegistry = new CancellationRegistry();
var documentConversionService = new DocumentConversionService();
var workspaceConversionService = new WorkspaceConversionService(documentConversionService);
var sessionRunner = new ConversionSessionRunner(documentConversionService, workspaceConversionService, cancellationRegistry);

var requestJson = await Console.In.ReadToEndAsync();
if (string.IsNullOrWhiteSpace(requestJson)) {
    return;
}

var serializerOptions = WorkerJson.SerializerOptions;
var request = JsonSerializer.Deserialize<ConversionRequest>(requestJson, serializerOptions)
    ?? throw new InvalidOperationException("The worker request payload could not be parsed.");

var response = await sessionRunner.RunAsync(request, CancellationToken.None);
var responseJson = JsonSerializer.Serialize(response, serializerOptions);
await Console.Out.WriteAsync(responseJson);
