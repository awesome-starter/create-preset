## [0.13.1](https://github.com/awesome-starter/create-preset/compare/v0.13.0...v0.13.1) (2023-03-14)


### Bug Fixes

* the `-v` option get the wrong version ([227ab09](https://github.com/awesome-starter/create-preset/commit/227ab09ae68467c9f3330244988b2f9c139ba660))

# [0.13.0](https://github.com/awesome-starter/create-preset/compare/v0.12.2...v0.13.0) (2023-01-30)


### Features

* add a tips to enable proxy ([e7f60f0](https://github.com/awesome-starter/create-preset/commit/e7f60f0fcc86269c751d2199c9d8b4c8c141ffae))
* add mirror config ([5cf4e14](https://github.com/awesome-starter/create-preset/commit/5cf4e14924d11e735d20904d1d66e91aaf088145))

## [0.12.2](https://github.com/awesome-starter/create-preset/compare/v0.12.1...v0.12.2) (2023-01-27)


### Bug Fixes

* remove invalid mirror proxy service ([3a7fc7b](https://github.com/awesome-starter/create-preset/commit/3a7fc7b65c3fded7799e9c3821b916e1f342d530))

## [0.12.1](https://github.com/awesome-starter/create-preset/compare/v0.12.0...v0.12.1) (2022-05-12)


### Bug Fixes

* change the proxy domain for download ([9bd0b90](https://github.com/awesome-starter/create-preset/commit/9bd0b90ce94b9e94bb3bbc200358b2a2ba511cf9))

# [0.12.0](https://github.com/awesome-starter/create-preset/compare/v0.11.0...v0.12.0) (2022-05-03)


### Features

* make the init command to be default ([f7754bd](https://github.com/awesome-starter/create-preset/commit/f7754bd515d55e047cdadab88651b4704760610d))
* support specify a template name when init ([c0fa9ea](https://github.com/awesome-starter/create-preset/commit/c0fa9ea47d3245c7d9a13c350eda4d4b501a2d2a))

# [0.11.0](https://github.com/awesome-starter/create-preset/compare/v0.10.0...v0.11.0) (2022-02-11)


### Features

* change download proxy source ([1aa0975](https://github.com/awesome-starter/create-preset/commit/1aa0975352880f8379bb1cb551617b8d90216743))

# [0.10.0](https://github.com/awesome-starter/create-preset/compare/v0.9.0...v0.10.0) (2022-01-27)


### Features

* community templates randomly sorted ([9e02764](https://github.com/awesome-starter/create-preset/commit/9e02764dbfee4b60768e283ee8f7118edca7716f))
* hide tech stack without templates on interactive interface ([cabbe4c](https://github.com/awesome-starter/create-preset/commit/cabbe4c9cad0ce7e4db7aad318d3f4772dc70fc4))

# [0.9.0](https://github.com/awesome-starter/create-preset/compare/v0.8.0...v0.9.0) (2022-01-25)


### Features

* make the local list first ([34b7998](https://github.com/awesome-starter/create-preset/commit/34b7998311510ac7e54d9a84ad928b8fc2f876ac))
* **pkg:** add assign version to test ([97270ad](https://github.com/awesome-starter/create-preset/commit/97270adbe0c174db8ae2703fae59068e21b1f8cc))
* unique tech stacks ([367f7f8](https://github.com/awesome-starter/create-preset/commit/367f7f86ceeb420031d70dbd3e67abe00b88d620))
* unique template list ([b92a6f8](https://github.com/awesome-starter/create-preset/commit/b92a6f86aeeef288c402ce07e64c2aaf00f6b4b7))

# [0.8.0](https://github.com/awesome-starter/create-preset/compare/v0.7.0...v0.8.0) (2022-01-24)


### Bug Fixes

- after removing the local config, the get command reads the wrong path

### Features

- support manage your local tech list
- support use proxy to download templates

```bash
Usage: preset <command> [options]

Options:
  -v, --version       output the version number
  -h, --help          output usage information

Commands:
  init|i [app-name]   generate a project from a preset template
  config|c [options]  use the local preset config
  proxy|p             use proxy to download template
  upgrade|u           updated version
  help [command]      display help for command

  Run preset init <app-name> to initialize your project.
```

# [0.7.0](https://github.com/awesome-starter/create-preset/compare/v0.6.0...v0.7.0) (2022-01-21)


rewrite in vite with typescript


# [0.6.0](https://github.com/awesome-starter/create-preset/compare/v0.5.0...v0.6.0) (2022-01-13)


### Features

- the configuration file is split into 3 parts: `official`, `community` and `local`
- fetch [configuration files](https://github.com/awesome-starter/website/tree/main/docs/public/config) from the official website, future template additions and updates will be handed over to the official website
- add `config` command, can manage local configuration
- if you create a local configuration, you can download templates for your own private repository
- add `upgrade` command, In the case of global installation, you can check whether the CLI needs to be upgraded
- temporarily remove fastgit acceleration, because it is found that it is only valid for Chinese networks, and networks in other regions cannot download templates. Later versions will be changed to custom configuration functions to provide acceleration

please pay attention to [the official website](https://preset.js.org/) documentation for the instructions of the new version


# [0.5.0](https://github.com/awesome-starter/create-preset/compare/v0.4.0...v0.5.0) (2022-01-10)

### Features

- add `rollup` starter
- update colors for tech stacks


# [0.4.0](https://github.com/awesome-starter/create-preset/compare/v0.3.0...v0.4.0) (2022-01-07)

### Features

- add a alias i for init command
- add electron starter
- add pkg starter

# [0.3.0](https://github.com/awesome-starter/create-preset/compare/v0.2.0...v0.3.0) (2022-01-06)

### Features

- remove local template
- support download remote repo starter to create project
- add `node-basic`, `node-express` template

# [0.2.0](https://github.com/awesome-starter/create-preset/compare/v0.1.0...v0.2.0) (2021-12-29)


### Features

- refactored most of the code, powered by [@vue/cli](https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli)
- added new commands support

```bash
Usage: preset <command> [options]

Options:
  -v, --version    output the version number
  -h, --help       output usage information

Commands:
  init [app-name]  generate a project from a preset template
  help [command]   display help for command

  Run preset init <app-name> to initialize your project.
```

# 0.1.0 (2021-12-27)

The basic version, powered by [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
