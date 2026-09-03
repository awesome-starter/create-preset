# Preset Configs

A project can distribute a maintained starter without building another CLI.
It hosts a declarative `preset.json`; Create Preset owns user interaction,
repository downloads, file operations, dependency resolution, and rollback.

Create Preset does not maintain a central URL registry. Each project publishes
and documents its own config URL:

```bash
preset init my-app --from https://example.com/preset.json
```

Local files use the same contract:

```bash
preset init my-app --from ./preset.json
```

## Minimal Config

Add `$schema` for editor completion and validation:

```json
{
  "$schema": "https://preset.js.org/schema/preset.schema.json",
  "version": 1,
  "source": {
    "repo": "https://github.com/example/project.git",
    "directory": "starters/docs"
  }
}
```

## Operations

- `exclude` removes repository paths before they reach the new project.
- `write` creates or replaces text files from an array of lines.
- `replace` makes exact text replacements in existing UTF-8 files.
- `json` applies merge patches to JSON files. A `null` value removes a key.
- `packageJson.resolveWorkspace` replaces `workspace:` dependencies with
  published npm versions. The lookup uses the user's npm configuration, so
  `.npmrc` scope registries and private registries are respected.
- `packageJson.workspaceVersions` pins selected workspace dependencies to an
  explicit version or range instead of querying the latest version.

```json
{
  "$schema": "https://preset.js.org/schema/preset.schema.json",
  "version": 1,
  "source": {
    "repo": "https://github.com/example/project.git",
    "directory": "starters/docs"
  },
  "exclude": ["src/__tests__", "vitest.config.ts"],
  "write": [
    {
      "path": "README.md",
      "lines": [
        "# Documentation",
        "",
        "Run `pnpm dev` to start the site."
      ]
    }
  ],
  "replace": [
    {
      "path": ".env.example",
      "from": "COMPANY_NAME=Example",
      "to": "COMPANY_NAME=Acme"
    }
  ],
  "json": [
    {
      "path": "package.json",
      "value": {
        "private": true,
        "scripts": {
          "test": null
        }
      }
    }
  ],
  "packageJson": {
    "resolveWorkspace": true,
    "workspaceVersions": {
      "vue": "3.4.38",
      "@company/ui": "1.8.2"
    }
  }
}
```

When no pin is provided, Create Preset runs `npm view <package> version` and
inherits the npm registry settings already configured by the user or CI. For
example, an `.npmrc` can route only a company scope to a private registry:

```ini
registry=https://registry.npmjs.org/
@company:registry=https://npm.company.example.com/
```

## Security Boundary

Remote configs should use HTTPS and are limited to 1 MiB. HTTP is accepted for
trusted private networks with a visible warning. A remotely loaded config may
only clone an HTTP(S) repository, never a local file or SSH URL. The runtime rejects unknown fields,
unsupported versions, unsafe relative paths, symlinks in starter sources, and
more than 1,000 operations. It never evaluates JavaScript or invokes a shell
from config values.

The schema is published with both the npm package and the website. Runtime
validation remains authoritative because editors do not always apply schemas.

## Showcase

Blackwork keeps its documentation starter in the Blackwork monorepo. Its
`preset.json` selects `apps/docs-starter`, excludes workspace-only files,
rewrites package metadata, and resolves published Blackwork package versions.
