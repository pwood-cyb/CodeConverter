using System.Collections.Concurrent;

namespace ICSharpCode.CodeConverter.VsCodeExtension.Worker.Services;

public sealed class CancellationRegistry
{
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _tokens = new();

    public CancellationToken Register(string sessionId, CancellationToken parentToken)
    {
        var source = CancellationTokenSource.CreateLinkedTokenSource(parentToken);
        _tokens[sessionId] = source;
        return source.Token;
    }

    public bool TryCancel(string sessionId)
    {
        if (_tokens.TryGetValue(sessionId, out var source)) {
            source.Cancel();
            return true;
        }

        return false;
    }

    public void Complete(string sessionId)
    {
        if (_tokens.TryRemove(sessionId, out var source)) {
            source.Dispose();
        }
    }
}
