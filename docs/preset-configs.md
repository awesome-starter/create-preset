# Preset configs

A `preset.json` describes how to turn a maintained repository starter into a
new project. Create Preset performs the checkout, file operations, dependency
resolution, and rollback; no second CLI is required.

Publish the file at a URL ending in `.json`:

```bash
preset init my-docs --from https://example.com/preset.json
```

Local files use the same contract:

```bash
preset init my-docs --from ./preset.json
```

## Preview and replacement

Preview the validated plan before creating a project:

```bash
preset init my-docs --from ./preset.json --dry-run
```

The JSON output includes the target directory, whether existing files would be
replaced, the repository source, all configured operations, and the final
metadata cleanup. Remote configs are fetched for validation, but previewing
never clones the source, resolves package versions, or changes files.

Config files are loaded before any target changes, so this also works:

```bash
preset init . --from ./preset.json
```

Generation and transformations finish in a temporary directory first. If they
fail, existing target files stay intact. When replacing files, a backup remains
available until publication completes. Normal errors restore originals; if
restoration itself fails, the error reports where the backup was retained.
This is filesystem rollback for the target directory, not recovery from a
forced process kill or a system crash.

Use `--yes` to explicitly allow replacing target files in scripts. Without it,
replacing a nonempty directory still requires confirmation.

## Minimal config

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

`version` must be `1`. `source.repo` is required. `source.directory` selects a
subdirectory inside the cloned repository and defaults to the repository root.

## Operations

After selecting the source directory, Create Preset copies its files with
`exclude` applied, then runs the remaining operations:

- `exclude` skips repository paths before copying.
- `write` creates or replaces a UTF-8 text file from an array of lines.
- `replace` replaces every exact text match in an existing UTF-8 file.
- `json` applies a recursive merge patch to an existing JSON object. A `null`
  value removes a key.
- `packageJson.resolveWorkspace` replaces `workspace:` dependencies in
  `dependencies`, `devDependencies`, `peerDependencies`, and
  `optionalDependencies` with published npm versions.
- `packageJson.workspaceVersions` pins selected workspace dependencies to an
  explicit version or range and skips the registry lookup for those entries.

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

When no pin is provided, the runtime invokes `npm view <package> version`.
The lookup inherits the npm registry settings from the environment, including
`.npmrc` scope registries and private registries:

```ini
registry=https://registry.npmjs.org/
@company:registry=https://npm.company.example.com/
```

`resolveWorkspace` requires a `package.json` in the generated project. A
`workspace:*` dependency becomes `^<published-version>`; `workspace:~` becomes
`~<published-version>`.

## Security and limits

Use HTTPS for public config URLs and repository sources. HTTP is accepted for
trusted private networks and prints a warning. A remote config may reference
only an HTTP(S) repository; local paths, `file://`, and SSH URLs are rejected
in that case.

The runtime enforces these boundaries:

- remote and local config files are limited to 1 MiB;
- config operation counts are limited to 1,000;
- unknown fields and unsupported versions are rejected;
- paths must stay relative to the generated project;
- source symlinks are rejected;
- config values never evaluate JavaScript or invoke a shell.

The published schema supports editor tooling. Runtime validation remains
authoritative when a schema-aware editor is unavailable or incomplete.

## Showcase

Blackwork keeps its documentation starter in the Blackwork monorepo. Its
config selects `apps/docs-starter`, excludes workspace-only files, rewrites
package metadata, and resolves published Blackwork package versions.
