<p align="center">
  <img
    width="400"
    src="https://cdn.jsdelivr.net/gh/awesome-starter/assets/create-preset/create-preset.svg"
    alt="create-preset"
  />
</p>

<h1 align='center'>create-preset</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/create-preset" target="__blank">
    <img src="https://img.shields.io/npm/v/create-preset?color=10b981&label=npm" />
  </a>
  <a href="https://www.npmjs.com/package/create-preset" target="__blank">
    <img src="https://img.shields.io/npm/dm/create-preset?color=10b981&label=" />
  </a>
  <a href="https://preset.js.org/guide/getting-started" target="__blank">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20demos&color=10b981" />
  </a>
  <a href="https://github.com/awesome-starter/create-preset" target="__blank">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/awesome-starter/create-preset?style=social" />
  </a>
</p>

English | [简体中文](https://preset.js.org/zh/)

## Features

Provides a unified CLI for creating and applying development presets.

`create-preset` delegates framework-owned projects to official CLIs and lets projects distribute maintained starters as declarative JSON. A preset config describes its starter source and transformations; Create Preset owns prompts, downloads, file operations, dependency resolution, and rollback without executing third-party configuration code.

If you find it useful, [Welcome to give it a Star](https://github.com/awesome-starter/create-preset) !

- ✈ Practicality - One entry point for official project generators.
- ⚡️ Efficient - Reduces repetitive configuration processes every time a new project is created.
- 🤹 Interactive - Simple command-line interactive operation.
- 🛠 Multi-Tech Stacks - Provide commonly used multiple technology stack project support.
- 🚀 Keep pace with the ecosystem - Let official CLIs own their templates and prompts.
- 🔑 Private Presets - Put your local presets first and keep private repositories private.
- 🧩 Declarative Presets - Distribute a starter with one `preset.json` instead of another CLI.

## Simply Usage

Node.js and a package manager are required for official generators. Git is required for repository-backed presets.

You can experience it through your package manager and choose an official generator or one of your private presets.

```bash
npm create preset
```

Then follow the prompts!

For copy-ready local build and E2E commands, see [Local debugging](docs/local-debugging.md).

`preset` currently supports official generators for Vue, Nuxt, Vite, and Next.js. Private presets configured with `preset config set <filePath>` are shown before official generators.

Private presets can introduce any technology stack, including Python, Go, iOS, Android, or internal company stacks. See [Private presets](docs/private-presets.md) for the simple array and versioned manifest formats.

Projects can distribute a starter through a JSON preset config hosted on their own website. Blackwork's docs starter is the first showcase: its config selects a monorepo subdirectory, removes workspace-only files, and asks Create Preset to replace `workspace:*` dependencies with published versions. See [Preset configs](docs/preset-configs.md).

```bash
preset init my-docs --from https://example.com/preset.json
```

### Migration to v1

Version 1.0 no longer downloads or maintains the remote `tech`, `official`, and `community` lists. Official generators and their brand colors are built in, while private presets can add arbitrary technology stacks. The legacy `--template` option prints a migration notice; use `--from` instead.

The `preset proxy` command, `config --tech`, `localTech`, and `mirror` field were also removed. Official generators use your package manager's registry configuration; private presets should set either `repo` or `config` to a source accessible in your environment.

## Global Usage

It is recommended to install globally for easier usage, Please install it globally first:

```bash
npm install -g create-preset
```

You can use the following command to check whether the installation was successful. If successful, you will get a version number.

```bash
preset -v
```

Run `preset upgrade` to update a global installation.

## Documentation

Please visit the official website for full docs.

See: [preset.js.org](https://preset.js.org/)

## Preview

![create-preset](https://cdn.jsdelivr.net/gh/chengpeiquan/assets-storage/img/2021/11/20220110155037.gif)

## License

MIT License © 2022 [chengpeiquan](https://github.com/chengpeiquan)
