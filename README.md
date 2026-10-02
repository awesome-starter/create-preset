<p align="center">
  <img
    width="400"
    src="https://cdn.jsdelivr.net/gh/awesome-starter/assets/create-preset/create-preset.svg"
    alt="create-preset"
  />
</p>

<h1 align="center">create-preset</h1>

<p align="center">
  Create projects with official generators and declarative JSON presets.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/create-preset" target="__blank">
    <img src="https://img.shields.io/npm/v/create-preset?color=10b981&label=npm" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/create-preset" target="__blank">
    <img src="https://img.shields.io/npm/dm/create-preset?color=10b981&label=downloads" alt="npm downloads" />
  </a>
  <a href="https://preset.js.org/guide/getting-started" target="__blank">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20demos&color=10b981" alt="documentation" />
  </a>
  <a href="https://github.com/awesome-starter/create-preset" target="__blank">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/awesome-starter/create-preset?style=social" />
  </a>
</p>

English | [简体中文](https://preset.js.org/zh/)

## Quick start

Node.js and a package manager are required for official generators. Git is
required for presets that clone a repository.

Run the interactive flow through npm's package runner:

```bash
npm create preset
```

The flow asks for a project directory, technology stack, and starter. The
selected official CLI owns the remaining prompts and generated files.

For repeated use, install the package globally:

```bash
npm install --global create-preset
preset
```

## Common commands

```bash
# List available starter IDs
preset --list

# Select a starter interactively
preset

# Create from a registered official or private preset
preset init my-app --from vite

# Create from a local or remote preset.json
preset init my-docs --from ./preset.json
preset init my-docs --from https://example.com/preset.json

# Choose the package manager used by an official generator
preset init my-app --from vue --package-manager pnpm

# Preview a generator or JSON preset without creating a project
preset init my-app --from vite --dry-run
preset init my-docs --from ./preset.json --dry-run

# Explicitly allow replacing an existing directory in a script
preset init my-app --from vite --yes

# Inspect or change the private preset manifest
preset config get
preset config set /path/to/private-presets.json
preset config remove

# Update a global installation
preset upgrade
```

`--from` accepts an official generator ID, a private preset name, or a
`.json` config path or URL. The `--package-manager` option accepts `npm`,
`yarn`, `pnpm`, and `bun`. Without that option, Create Preset detects the
package manager from the current npm user agent and falls back to npm.
An unknown explicit `--from` value exits with an error; it never switches to
interactive selection. Run `preset --list` to see registered IDs.

`--dry-run` prints a JSON creation plan without cloning repositories, running
generators, resolving npm versions, or changing project files. Remote config
URLs are still fetched and validated. `--yes` skips only the confirmation for
replacing existing target files; official generators keep their own prompts.

Private presets are generated in a temporary directory before replacing the
target. Original target files are backed up while an official generator runs
and restored if it fails or exits without creating a project.

## Official generators

Official generators remain responsible for their own prompts, dependencies,
and output. Create Preset currently exposes these IDs:

| Technology | IDs |
| --- | --- |
| Vue | `vue`, `nuxt` |
| React | `next-app`, `react-router`, `expo-app` |
| Vite | `vite` |
| Astro | `astro` |
| Svelte | `svelte` (SvelteKit) |

Direct selection is useful for scripts and documentation examples:

```bash
preset init demo --from next-app --package-manager npm
```

## Private presets

Private presets add repository starters or declarative configs to the
interactive catalog. Bind one manifest file globally:

```bash
preset config set /path/to/private-presets.json
preset init company-service
```

Private entries appear before built-in generators in the same technology stack,
and custom technology IDs are supported. The manifest can use a simple array
or a versioned object when a custom label or color is needed. See
[Private presets](docs/private-presets.md).

## Hosted preset configs

A project can publish a `preset.json` without maintaining another CLI. The
config describes a repository source and the transformations needed to turn a
starter into a new project:

```bash
preset init my-docs --from https://example.com/preset.json
```

Supported operations include selecting a monorepo directory, excluding files,
writing files, replacing text, merging JSON, and resolving `workspace:`
dependencies. See [Preset configs](docs/preset-configs.md) and the published
[schema](https://preset.js.org/schema/preset.schema.json).

## Locale

The CLI follows the system locale and includes English, Simplified Chinese,
Traditional Chinese, and Japanese. Set `PRESET_LANG` to override detection:

```bash
PRESET_LANG=ja-JP preset init demo
```

Supported values are `en-US`, `zh-CN`, `zh-HK`, and `ja-JP`; common locale
variants map to the same four translations. After delegation, the official
generator controls its own locale.

## Migration to v1

Version 1 builds the official generator catalog into the binary. The remote
`tech`, `official`, and `community` lists are no longer downloaded.

The legacy `--template` option remains available only to print a migration
notice. Replace it with `--from`:

```bash
preset init old-demo --from vue
```

The `preset proxy` command and the `config --tech`, `localTech`, and `mirror`
settings were removed. Official generators use the selected package manager's
registry configuration. Private presets should point to a `repo` or `config`
source that is reachable from the execution environment.

## Documentation

- [Getting started](https://preset.js.org/guide/getting-started)
- [Private presets](docs/private-presets.md)
- [Preset configs](docs/preset-configs.md)
- [Local verification](docs/local-debugging.md)

## License

MIT License © 2022 [chengpeiquan](https://github.com/chengpeiquan)
