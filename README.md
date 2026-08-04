# Codex Session Insert

右键菜单一键将代码引用（`[@file]` 或 `[@file#line-line]`，路径相对工作区根）复制并粘贴到 Codex 对话输入框。行为固定，无设置项。

## 使用

在编辑器中选中代码或停光标，右键 → **插入Codex**（按选区生成引用）；
或在资源管理器中右键文件/文件夹（支持多选），→ **插入Codex**（引用整个路径）。

## 引用格式

| 场景 | 示例 |
| --- | --- |
| 无选区 | `[@src/foo.ts]` |
| 单行 | `[@src/foo.ts#10]` |
| 多行 | `[@src/foo.ts#10-20]` |
| 多文件 | `[@src/a.ts, @src/b.ts]`（默认）或 `[@src/a.ts][@src/b.ts]` |

## 设置

多文件插入样式可通过设置 `codexSessionInsert.multiFileStyle` 切换（设置 UI 中为下拉框）：

| 值 | 样式 |
| --- | --- |
| `comma`（默认） | `[@file1, @file2]` |
| `separate` | `[@file1][@file2]` |

是否在插入 Codex 的同时把引用复制到剪贴板，可通过 `codexSessionInsert.copyToClipboard` 控制：

| 值 | 行为 |
| --- | --- |
| `false`（默认） | 只插入引用，不改变剪贴板内容 |
| `true` | 插入引用，并同时复制到剪贴板 |

## 打包为 VSIX

```bash
npm install
npm run compile
npx @vscode/vsce package
```

生成 `codex-session-insert-0.1.2.vsix` 文件，在 VS Code 扩展面板中通过「… → 从 VSIX 安装…」即可安装。

## License

MIT
