using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Contracts;
using ICSharpCode.CodeConverter.VsCodeExtension.Worker.Models;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

public sealed class ConversionSessionRunner
{
    private readonly DocumentConversionService _documentConversionService;
    private readonly WorkspaceConversionService _workspaceConversionService;
    private readonly CancellationRegistry _cancellationRegistry;

    public ConversionSessionRunner(
        DocumentConversionService documentConversionService,
        WorkspaceConversionService workspaceConversionService,
        CancellationRegistry cancellationRegistry)
    {
        _documentConversionService = documentConversionService;
        _workspaceConversionService = workspaceConversionService;
        _cancellationRegistry = cancellationRegistry;
    }

    public async Task<ConversionResponse> RunAsync(ConversionRequest request, CancellationToken cancellationToken)
    {
        var session = new ConversionSession
        {
            SessionId = request.SessionId,
            Direction = request.Direction,
            Operation = request.Operation,
            Targets = request.Targets.Select(t => new ConversionTarget
            {
                TargetId = t.TargetId,
                TargetType = t.TargetType,
                SourcePath = t.SourcePath,
                SourceText = t.SourceText
            }).ToArray()
        };

        var sessionToken = _cancellationRegistry.Register(session.SessionId, cancellationToken);
        try {
            IReadOnlyList<ConversionOutcomeDto> outcomes = request.Operation switch
            {
                "selection" or "document" or "paste" => await _documentConversionService.ConvertAsync(request, sessionToken),
                "explorer-items" or "project" => await _workspaceConversionService.ConvertAsync(request, sessionToken),
                _ => request.Targets.Select(target => new ConversionOutcomeDto
                {
                    TargetId = target.TargetId,
                    Status = "failure",
                    Errors = new[] { $"The '{request.Operation}' operation is not implemented yet." },
                    Message = "Operation is not implemented yet."
                }).ToArray()
            };

            var summary = new ConversionSummary
            {
                SuccessCount = outcomes.Count(o => o.Status == "success"),
                WarningCount = outcomes.Count(o => o.Status == "warning"),
                FailureCount = outcomes.Count(o => o.Status == "failure"),
                CanceledCount = outcomes.Count(o => o.Status == "canceled")
            };

            return new ConversionResponse
            {
                SessionId = session.SessionId,
                Status = summary.FailureCount > 0 ? "failed" : "completed",
                Summary = new ConversionSummaryDto
                {
                    SuccessCount = summary.SuccessCount,
                    WarningCount = summary.WarningCount,
                    FailureCount = summary.FailureCount,
                    CanceledCount = summary.CanceledCount
                },
                Outcomes = outcomes
            };
        } finally {
            _cancellationRegistry.Complete(session.SessionId);
        }
    }
}
