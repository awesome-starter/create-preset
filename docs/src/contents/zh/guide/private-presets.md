---
title: 私有 Preset
description: 用本地配置管理团队模板。
order: 3
---

# 私有 Preset

将团队模板的仓库地址写入本地 JSON 文件。绑定后，可以在 `preset init` 中选择，也可以按名称直接创建。

## 添加仓库模板

创建 `private-presets.json`，写入模板信息：

```json
[
  {
    "tech": "python",
    "name": "company-fastapi",
    "desc": "Company FastAPI service",
    "repo": "git@github.com:company/fastapi-preset.git"
  }
]
```

将 `repo` 换成实际的仓库地址，并确保本机 Git 能够访问。`tech` 用于技术栈分组，`name` 用于选择模板，`desc` 是可选的描述。

绑定文件并查看保存的路径：

```bash
preset config set /path/to/private-presets.json
preset config get
```

将 `/path/to/private-presets.json` 换成实际路径，再按名称创建项目：

```bash
preset init my-service --from company-fastapi
```

`tech` 会自动加入技术栈列表，支持 Python、Go、iOS、Android 等自定义分组。同一技术栈下，私有选项排在官方脚手架前面。

`config set` 会先校验配置，再保存路径。文件至少需要包含一个 Preset，名称和来源均不能重复，每个条目必须且只能指定 `repo` 或 `config` 中的一项。

## 移除绑定

清除已保存的路径：

```bash
preset config remove
```

命令会移除绑定，保留配置文件。已绑定的文件丢失或无效时，CLI 会显示警告，内置官方脚手架仍可使用。用 `preset --list` 检查可用来源。

## 使用 Preset 配置

需要选择仓库子目录或修改文件时，用 `config` 指向 Preset 配置。下面是一个列表条目：

```json
{
  "tech": "react",
  "name": "company-docs",
  "config": "./company-docs.json"
}
```

`repo` 和 `config` 二选一。上面的相对路径以 `private-presets.json` 所在目录为基准，`company-docs.json` 的写法见 [Preset 配置](/zh/guide/preset-configs)。

需要自定义技术栈名称和颜色时，使用带 `version` 字段的配置格式，详见[私有 Preset 配置说明](https://github.com/preset-cli/create-preset/blob/main/docs/private-presets.md)。

## 创建后保留哪些文件

直接使用 `repo` 创建时，CLI 只删除克隆得到的 `.git` 元数据，锁文件、许可证、工作流、skills 和 `AGENTS.md` 都会保留。如果存在 `package.json`，其中的 `name` 会更新为新项目名称。

使用 `config` 时，文件还会按对应配置中的规则处理。
