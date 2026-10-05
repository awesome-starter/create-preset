---
title: Preset 配置
description: 用 JSON 配置模板来源和文件处理步骤。
order: 4
---

# Preset 配置

模板位于 monorepo 子目录，或创建时需要删掉测试文件、改写 README，可以通过 `preset.json` 配置。

将配置文件发布到网站，再用它的地址创建项目：

```bash
preset init my-docs --from https://example.com/preset.json
```

将示例地址换成实际地址。Create Preset 会下载仓库，按配置处理文件和依赖版本。

## 编写配置

下面的配置从仓库中取出 `apps/starter` 目录，排除测试文件，写入新的 README，并将 workspace 依赖换成已发布的版本。`$schema` 用于编辑器补全和校验：

```json
{
  "$schema": "https://preset.js.org/schema/preset.schema.json",
  "version": 1,
  "source": {
    "repo": "https://github.com/company/product.git",
    "directory": "apps/starter"
  },
  "exclude": ["src/app/__tests__", "vitest.config.ts"],
  "write": [
    {
      "path": "README.md",
      "lines": ["# Product Docs", "", "运行 `pnpm dev` 开始开发。"]
    }
  ],
  "packageJson": {
    "resolveWorkspace": true
  }
}
```

`source.directory` 相对于仓库根目录，其余路径相对于模板目录。示例中的文件操作都作用于 `apps/starter`。

文件处理按以下顺序执行：

- `exclude`：复制选中的模板前，排除指定路径。
- `write`：将字符串数组写成 UTF-8 文本文件，可新建或替换文件。
- `replace`：替换已有 UTF-8 文件中所有完全匹配的文本。
- `json`：递归合并已有 JSON 对象，值为 `null` 时移除对应字段。

生成的 `package.json.name` 会设为新项目名称。

## 预览与替换文件

预览创建计划：

```bash
preset init test-docs --from ./preset.json --dry-run
```

输出的 JSON 包含目标目录、替换状态、来源、文件操作和元数据清理步骤。远程配置仍会被下载并校验；预览不会克隆仓库、查询 npm 版本或修改文件。

发布前，用本地配置创建一次项目，检查生成的目录和文件：

```bash
preset init test-docs --from ./preset.json
```

配置文件会在修改目标目录前读取，支持 `preset init . --from ./preset.json`。非空目标目录需要确认替换，在脚本中可用 `--yes` 允许替换。

项目先在临时目录中生成，失败时保留目标目录中的原文件。替换完成前会保留备份，发生错误时恢复原文件；恢复失败时，错误信息会给出备份位置。强制终止进程或系统崩溃可能中断恢复。

## 处理 workspace 依赖

monorepo 模板中的 `workspace:` 依赖需要换成已发布版本，才能在仓库外安装。将 `packageJson.resolveWorkspace` 设为 `true`，CLI 会通过 `npm view` 查询并替换版本。

查询沿用 npm 配置，包括 `.npmrc` 中按 scope 设置的私有 registry。需要指定版本或版本范围时，使用 `packageJson.workspaceVersions`。

下面的 `packageJson` 配置固定了两个依赖的版本，并跳过它们的 registry 查询：

```json
{
  "resolveWorkspace": true,
  "workspaceVersions": {
    "vue": "3.4.38",
    "@company/ui": "1.8.2"
  }
}
```

解析范围包括 `dependencies`、`devDependencies`、`peerDependencies` 和 `optionalDependencies`，生成的项目中必须存在 `package.json`。未指定固定版本时，`workspace:*` 会变成 `^<已发布版本>`，`workspace:~` 会变成 `~<已发布版本>`。

## 配置校验

远程配置和源仓库建议使用 HTTPS。HTTP 会显示警告，可用于可信内网。远程配置不能引用本机文件或 SSH 仓库。

配置文件最大为 1 MiB，`exclude`、`write`、`replace` 和 `json` 中的操作总数最多为 1,000。CLI 会拒绝未知字段、不支持的版本、超出生成项目范围的路径和源文件中的符号链接。配置值不会执行 JavaScript 或调用 shell。编辑器中的 JSON Schema 用于编写时检查，运行命令时仍会再次校验。

## Blackwork 示例

[Blackwork](https://github.com/chengpeiquan/blackwork) 的文档模板放在 monorepo 中。它通过 `preset.json` 选择模板目录，移除仅供 monorepo 使用的文件，再解析已发布的 Blackwork 包版本。模板和配置都在该项目中维护。

更多字段和用法见 [Preset 配置参考](https://github.com/preset-cli/create-preset/blob/main/docs/preset-configs.md)。
