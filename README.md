# create-preset

Provides the ability to quickly create preset projects.

> **Compatibility Note:**<br>
> Some preset project requires [Node.js](https://nodejs.org/en/) version >=12.2.0 (e.g. Vite). However, some templates require a higher Node.js version to work, please upgrade if your package manager warns about it.

## Usage

You can simply create it directly through the package management command:

With NPM:

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
