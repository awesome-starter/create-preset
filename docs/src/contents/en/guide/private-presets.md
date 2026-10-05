---
title: Private Presets
description: Manage team templates with a local config.
order: 3
---

# Private Presets

Add team template repositories to a local JSON file. After binding the file, select a template in `preset init` or use its name directly.

## Add a repository template

Create `private-presets.json` with the template details:

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

Replace `repo` with the actual repository URL and check that local Git can access it. `tech` groups presets by stack, `name` identifies the preset, and `desc` is an optional description.

Register the file, then check the saved path:

```bash
preset config set /path/to/private-presets.json
preset config get
```

Replace `/path/to/private-presets.json` with the actual path, then create a project by name:

```bash
preset init my-service --from company-fastapi
```

Each `tech` value becomes a stack option, supporting custom groups such as Python, Go, iOS, and Android. Private options appear before official generators within each stack.

`config set` validates the manifest before saving its path. The file must contain at least one preset, names and sources must be unique, and each entry must define exactly one of `repo` or `config`.

## Remove a binding

Clear the saved path with:

```bash
preset config remove
```

The command clears the binding and keeps the file. If the bound file is missing or invalid, the CLI prints a warning and keeps built-in generators available. Check the available sources with `preset --list`.

## Use a preset config

Use `config` for templates that need a repository subdirectory or file changes. For example, add this entry to the private preset list:

```json
{
  "tech": "react",
  "name": "company-docs",
  "config": "./company-docs.json"
}
```

Each entry uses either `repo` or `config`. The relative path above starts from the directory containing `private-presets.json`. See [Preset configs](/guide/preset-configs) for the contents of `company-docs.json`.

For custom stack labels and colors, use the format with a `version` field described in the [private preset reference](https://github.com/preset-cli/create-preset/blob/main/docs/private-presets.md).

## Files kept in the new project

When using `repo` directly, the CLI removes only the cloned `.git` metadata. Lockfiles, licenses, workflows, skills, and `AGENTS.md` files are preserved. If a `package.json` exists, its `name` is updated to match the new project name.

When using `config`, files are also processed according to that config's rules.
