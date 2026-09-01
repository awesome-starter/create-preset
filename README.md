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
  <a href="https://preset.js.org/docs.html" target="__blank">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20demos&color=10b981" />
  </a>
  <a href="https://github.com/awesome-starter/create-preset" target="__blank">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/awesome-starter/create-preset?style=social" />
  </a>
</p>

English | [简体中文](https://preset.js.org/zh/)

## Features

Provides a unified CLI for creating and applying development presets.

`create-preset` delegates project creation to official CLIs and keeps your private presets at the center of the workflow. A preset can grow beyond a starter project to include company-specific skills, `AGENTS.md`, and other repeatable development configuration.

If you find it useful, [Welcome to give it a Star](https://github.com/awesome-starter/create-preset) !

- ✈ Practicality - One entry point for official project generators.
- ⚡️ Efficient - Reduces repetitive configuration processes every time a new project is created.
- 🤹 Interactive - Simple command-line interactive operation.
- 🛠 Multi-Tech Stacks - Provide commonly used multiple technology stack project support.
- 🚀 Keep pace with the ecosystem - Let official CLIs own their templates and prompts.
- 🔑 Private Presets - Put your local presets first and keep private repositories private.

## Simply Usage

Node.js and a package manager are required for official generators; Git is only required when using a private Git preset.

You can experience it through your package manager and choose an official generator or one of your private presets.

```bash
npm create preset
```

Then follow the prompts!

For copy-ready local build and E2E commands, see [Local debugging](docs/local-debugging.md).

`preset` currently supports official generators for Vue, Vite, and Next.js. Private presets configured with `preset config set <filePath>` are shown before official generators.

### Migration from v1

Version 2 no longer downloads or maintains the remote `official` and `community` starter lists. When an old template name is passed with `--template`, the CLI explains that the starter repository was retired and presents the new choices. Your local preset file remains supported.

## Global Usage

It is recommended to install globally for easier usage, Please install it globally first:

```bash
npm install -g create-preset
```

You can use the following command to check whether the installation was successful. If successful, you will get a version number.

```bash
preset -v
```

You can refer to [Upgrade](https://preset.js.org/guide.html#upgrade) to learn how to upgrade in the future.

## Documentation

Please visit the official website for full docs.

See: [preset.js.org](https://preset.js.org/)

## Preview

![create-preset](https://cdn.jsdelivr.net/gh/chengpeiquan/assets-storage/img/2021/11/20220110155037.gif)

## License

MIT License © 2022 [chengpeiquan](https://github.com/chengpeiquan)
