# Codex Session Insert

右键菜单一键将代码引用（`[@file]` 或 `[@file#line-line]`，路径相对工作区根）复制并粘贴到 Codex 对话输入框。行为固定，无设置项。

## 使用

选中代码或停光标，右键 → **插入Codex**。

## 引用格式

| 场景 | 示例 |
| --- | --- |
| 无选区 | `[@src/foo.ts]` |
| 单行 | `[@src/foo.ts#10]` |
| 多行 | `[@src/foo.ts#10-20]` |

## 开发

```bash
npm install
npm run compile
```

VS Code 中按 `F5` 启动调试。

## License

MIT
