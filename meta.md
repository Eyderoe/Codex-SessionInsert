# Project Overview: Codex Session Insert

## 1. Summary
VS Code 扩展：通过编辑器/资源管理器右键菜单，一键生成 Codex 文件引用（`[@file]` 或 `[@file#line-line]`）并自动粘贴到 Codex 对话输入框。技术栈为 TypeScript + VS Code Extension API，无运行时依赖，编译产物为 CommonJS。

## 2. Directory Map
- `src/`
  - `extension.ts` - 唯一源码入口：命令注册、引用字符串构建、剪贴板与粘贴流程编排
- `scripts/`
  - `build.sh` / `build.ps1` - 跨平台 VSIX 打包脚本（内部调用 vsce）
- `out/` - `tsc` 编译产物（`extension.js` + sourcemap），即 `package.json` 的 `main` 入口
- `package.json` - 扩展清单：命令/菜单/配置项声明、编译与打包脚本、VS Code 引擎版本
- `tsconfig.json` - TypeScript 编译配置（strict、CommonJS、ES2020）
- `README.md` - 使用说明与引用格式规范文档
- `meta.md` - 本文件：面向 LLM/AI 的项目索引

## 3. Tech Stack & Standards
- **Core Tech**: TypeScript ^5.0.0；VS Code Extension API ^1.74.0；@vscode/vsce ^3.9.2（仅打包用）；无运行时依赖
- **Coding Rules**:
  - 开启 `strict` 严格模式；模块格式 CommonJS，目标 ES2020
  - 路径一律经 `workspace.asRelativePath` 转为工作区相对路径
  - 常量使用模块级 UPPER_SNAKE_CASE 命名；注释与 UI 文案使用中文
  - 业务逻辑集中在单一入口文件，不拆分模块
- **Commands**:
  - 安装依赖：`npm install`
  - 编译：`npm run compile`（`tsc -p ./`）
  - 监听编译：`npm run watch`
  - 打包 VSIX：`npx @vscode/vsce package`（或 `scripts/build.sh`）

## 4. Architecture & Data Flow
Context Menu（editor / explorer）→ `codexSessionInsert.insert` 命令处理器 → 按触发来源构建引用串（编辑器选区 / 整文件 / 资源管理器多选）→ 写入剪贴板（默认先备份原内容）→ 聚焦 Codex 输入框（`codex.chat.focusInput` 或 `chatgpt.openSidebar`，取第一个可用命令）→ 执行粘贴 → 延迟恢复剪贴板。全程为客户端命令编排，无后端、无持久化状态。

## 5. Key Interfaces & Models
- `codexSessionInsert.insert` 命令 - 唯一入口命令，注册于 `src/extension.ts`；在 `package.json` 中声明编辑器/资源管理器右键菜单与激活事件
- 配置项 `codexSessionInsert.multiFileStyle`（comma / separate）与 `codexSessionInsert.copyToClipboard` - 定义于 `package.json`，控制多文件引用样式与剪贴板行为
- 引用格式模型 - `[@rel/path]`（整文件）、`[@rel/path#10]`（单行）、`[@rel/path#10-20]`（多行）、`[@a, @b]` 或 `[@a][@b]`（多文件），由 `buildReference` / `buildMultiFileReference` 生成
