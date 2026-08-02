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
  const disposable = vscode.commands.registerCommand(
    'codexSessionInsert.insert',
    async (uri?: vscode.Uri, selectedUris?: vscode.Uri[]) => {
      const editor = vscode.window.activeTextEditor;
      // 编辑器右键菜单会传入当前文档 URI，资源管理器右键会传入所选文件的 URI（多选时为数组）
      const isFromEditorContext = !!editor && !!uri && editor.document.uri.toString() === uri.toString();

      let reference: string;

      if (isFromEditorContext) {
        // 编辑器内：按选区生成引用
        const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
        reference = selectionCoversWholeFile(editor)
          ? `[@${relativePath}]`
          : buildReference(relativePath, editor.selection);
      } else if (selectedUris && selectedUris.length > 0) {
        // 资源管理器多选：为每个选中的文件/文件夹生成引用，逗号分隔
        const paths = selectedUris.map(
          (selectedUri) => `@${vscode.workspace.asRelativePath(selectedUri, false)}`
        );
        reference = `[${paths.join(', ')}]`;
      } else if (uri) {
        // 资源管理器单选：引用整个文件/文件夹
        reference = `[@${vscode.workspace.asRelativePath(uri, false)}]`;
      } else if (editor) {
        const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
        reference = selectionCoversWholeFile(editor)
          ? `[@${relativePath}]`
          : buildReference(relativePath, editor.selection);
      } else {
        vscode.window.showWarningMessage('Codex Session Insert: Please open a file first');
        return;
      }

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
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
