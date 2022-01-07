# create-preset

Provides the ability to quickly create preset projects.

![create-preset](https://cdn.jsdelivr.net/gh/chengpeiquan/assets-storage/img/2021/11/20211229183022.gif)

>It is still in the early stage of development, and the version update will be more frequent, please try to use [Usage](#usage) instead of [Global Usage](#global-usage)

## Compatibility Note:

Some preset project requires [Node.js](https://nodejs.org/en/) version >=12.2.0 (e.g. Vite). However, some templates require a higher Node.js version to work, please upgrade if your package manager warns about it.

## Usage

You can simply create it directly through the package management command:

```bash
npm init preset@latest init
# OR
yarn create preset init
```

Then follow the prompts!

This usage allows you to use the latest version of scaffolding every time.

## Global Usage

You can also install globally for easier usage, Please install it globally first:

```bash
npm install -g create-preset
# OR
yarn global add create-preset
```

You can use this command to check whether the installation is successful:

```bash
preset -v
```

Then you can use the following command to create your preset project:

```bash
preset init
```

If you want to update the version later, you can use the following command to operate:

```bash
npm update -g create-preset
# OR
yarn global upgrade --latest create-preset
```

Or reinstall it globally, haha!

## Starters

Tech Stack|Name|Description
:-:|:-:|:--
vue|vite-vue3-ts|A template for Vue 3.0 with TypeScript, base on Vite.
node|node-basic|A basic Node.js project template.
node|node-server-express|A express template for Node.js project.
node|node-program-pkg|A program template for Node.js project, use pkg to packaged.
electron|electron-vue3-ts|An electron template with Vue 3.0 and TypeScript for client project.
