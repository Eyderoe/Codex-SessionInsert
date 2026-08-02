import * as vscode from 'vscode';

const CODEX_DEFAULT_FOCUS_COMMANDS = ['codex.chat.focusInput', 'chatgpt.openSidebar'];
const CODEX_DEFAULT_PASTE_COMMAND = 'editor.action.clipboardPasteAction';
const DEFAULT_FOCUS_DELAY_MS = 80;

async function executeFirstAvailableCommand(commandIds: string[]): Promise<boolean> {
  const commands = await vscode.commands.getCommands(true);
  const command = commandIds.find((commandId) => commands.includes(commandId));

  if (!command) {
    return false;
  }

  await vscode.commands.executeCommand(command);
  return true;
}

function selectionCoversWholeFile(editor: vscode.TextEditor): boolean {
  const selection = editor.selection;
  const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
  const fileStart = new vscode.Position(0, 0);
  const fileEnd = lastLine.range.end;

  return selection.start.isEqual(fileStart) && selection.end.isEqual(fileEnd);
}

function buildReference(relativePath: string, selection: vscode.Selection): string {
  if (selection.isEmpty) {
    // 无选区：引用整个文件 [@src/foo.ts]
    return `[@${relativePath}]`;
  }

  const startLine = selection.start.line + 1;
  const endLine = selection.end.line + 1;

  if (startLine === endLine) {
    // 单行选区 [@src/foo.ts#10]
    return `[@${relativePath}#${startLine}]`;
  }

  // 多行选区 [@src/foo.ts#10-20]
  return `[@${relativePath}#${startLine}-${endLine}]`;
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('codexSessionInsert.insert', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Codex Session Insert: Please open a file first');
      return;
    }

    const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const reference = selectionCoversWholeFile(editor)
      ? `[@${relativePath}]`
      : buildReference(relativePath, editor.selection);

    await vscode.env.clipboard.writeText(reference);

    // 聚焦 Codex 输入框并粘贴 [@file] / [@file#line-line]
    const didFocus = await executeFirstAvailableCommand(CODEX_DEFAULT_FOCUS_COMMANDS);

    if (!didFocus) {
      vscode.window.showWarningMessage(
        'Codex Session Insert: No available Codex focus command found. Please install the Codex VS Code extension.'
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_FOCUS_DELAY_MS));

    try {
      await vscode.commands.executeCommand(CODEX_DEFAULT_PASTE_COMMAND);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showWarningMessage(`Codex Session Insert: Paste failed: ${message}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
