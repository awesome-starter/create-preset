---
title: 迁移到 1.0
description: 更新旧版命令和模板来源，适配 Create Preset 1.0。
order: 5
---

# 迁移到 1.0

1.0 移除了远程 community 和 official 模板列表。官方脚手架改为内置选项，私有 Preset 从本地配置读取。升级时，需要检查脚本中的模板名称和命令参数。

## 需要调整的用法

| 旧用法 | 调整方式 |
| --- | --- |
| `--template` | 改用 `--from`，并检查来源名称是否仍可用 |
| `preset proxy on/off` | 直接配置包管理器或 Git 的网络访问 |
| `config --tech` / `localTech` | 在私有 Preset 文件中添加 `tech` |
| `preset i` / `preset c` / `preset u` | 改用 `preset init` / `preset config` / `preset upgrade` |
| `mirror` 配置 | 通过 Git 配置仓库访问，通过包管理器配置 registry 访问 |
| 远程 community starter | 将需要继续使用的模板仓库添加为私有 Preset |

`--from` 接受官方脚手架 ID、私有 Preset 名称，以及 JSON 配置路径或地址。旧模板名称不会自动映射到新来源，需要保留的仓库应添加为[私有 Preset](/zh/guide/private-presets)。

更新脚本前，运行 `preset --list` 检查新的来源 ID。例如，SvelteKit 官方脚手架使用 `svelte`。指定的 `--from` 不存在时，命令会报错退出。

1.0 仍保留隐藏的 `--template` 兼容选项，使用时会显示迁移提示。更新脚本时改用 `--from`，再运行一次检查来源。
