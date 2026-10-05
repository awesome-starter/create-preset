---
title: 官方脚手架
description: 支持的官方脚手架和调用命令。
order: 2
---

# 官方脚手架

Create Preset 会将项目名称传给选中的官方 CLI，后续配置和依赖安装由该 CLI 处理。

## 支持的脚手架

下表列出 pnpm 的调用命令：

| Preset | `--from` ID | 包管理器命令 |
| --- | --- | --- |
| Official Vue Starter | `vue` | `pnpm create vue <project>` |
| Nuxt | `nuxt` | `pnpm create nuxt <project>` |
| Official Vite CLI | `vite` | `pnpm create vite <project>` |
| Official Next.js Starter | `next-app` | `pnpm create next-app <project>` |
| Official React Router | `react-router` | `pnpm create react-router <project>` |
| Official Astro Starter | `astro` | `pnpm create astro <project>` |
| Official Expo App | `expo-app` | `pnpm create expo-app <project>` |
| Official SvelteKit Starter | `svelte` | `pnpm dlx sv create <project>` |

`<project>` 会替换为输入的项目名称。

SvelteKit 使用 `--from svelte`，实际调用的脚手架包是 `sv`。运行 `preset --list` 可以查看可用 ID，包括私有 Preset。

## 指定包管理器

用 `--package-manager` 指定 pnpm、npm、Yarn 或 Bun。例如，用 pnpm 创建 Next.js 项目：

```bash
preset init dashboard --from next-app --package-manager pnpm
```

这个选项决定启动脚手架的包管理器。官方 CLI 的提问、警告和更新提示会直接显示在终端中。

未指定 `--package-manager` 时，Create Preset 会从当前 npm user agent 检测包管理器，无法识别时使用 npm。添加 `--dry-run` 可以查看选中的命令，无需启动脚手架：

```bash
preset init dashboard --from next-app --package-manager pnpm --dry-run
```
