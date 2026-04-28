# Code Converter for VS Code

This extension brings CodeConverter's VB.NET and C# workflows into VS Code by
pairing a TypeScript extension host with a local .NET worker built from the
same conversion engine used elsewhere in this repository.

## Supported command surface

- Convert selected text from VB.NET to C#
- Convert selected text from C# to VB.NET
- Convert the active document in either direction
- Convert selected Explorer files in either direction
- Paste clipboard code as converted C# or VB.NET
- Cancel the active conversion session

The VS Code extension intentionally does not expose solution or project
conversion yet. Those workflows still rely on richer MSBuild and `dotnet`
context in the CLI and Visual Studio extension, while this package is designed
to install and run as a local desktop extension without requiring `dotnet` on
the end user's `PATH`.

## How it operates

- The extension host gathers the current selection, document, clipboard text, or
  selected Explorer files.
- It sends a JSON request to a local worker built from `VsCodeExtension.Worker`.
- The worker uses the shared `CodeConverter` engine, returns converted text for
  editor flows, and writes converted sibling files for Explorer flows.
- The packaged VSIX includes the worker executable for Windows installs. During
  development, the extension can also launch a locally built worker output.

## Settings

- `codeConverter.copySingleResultToClipboard`
- `codeConverter.autoApproveOverwrite`
- `codeConverter.createBackups`
- `codeConverter.formattingTimeoutMinutes`
- `codeConverter.bypassAssemblyLoadingErrors`

## Development

```powershell
Set-Location VsCodeExtension
npm install
npm test
npm run package:vsix
```

`npm run package:vsix` performs a hard `dotnet publish` of
`VsCodeExtension.Worker` into `VsCodeExtension/worker/`, validates the payload,
and then packages the extension. If any step fails, packaging stops and writes
details to `VsCodeExtension/package-vsix.log`.

The published VSIX launches the packaged worker executable directly on Windows,
so installed users do not need `dotnet` at runtime.
