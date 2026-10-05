---
title: Official Generators
description: Supported official generators and their commands.
order: 2
---

# Official Generators

Create Preset passes the project name to the selected official CLI, which handles configuration and dependency installation.

## Supported generators

The table shows the pnpm commands:

| Preset | `--from` ID | Package manager command |
| --- | --- | --- |
| Official Vue Starter | `vue` | `pnpm create vue <project>` |
| Nuxt | `nuxt` | `pnpm create nuxt <project>` |
| Official Vite CLI | `vite` | `pnpm create vite <project>` |
| Official Next.js Starter | `next-app` | `pnpm create next-app <project>` |
| Official React Router | `react-router` | `pnpm create react-router <project>` |
| Official Astro Starter | `astro` | `pnpm create astro <project>` |
| Official Expo App | `expo-app` | `pnpm create expo-app <project>` |
| Official SvelteKit Starter | `svelte` | `pnpm dlx sv create <project>` |

`<project>` is replaced with the supplied project name.

For SvelteKit, use `--from svelte`; the generator package it launches is `sv`. Run `preset --list` to inspect the available IDs, including private presets.

## Choose a package manager

Use `--package-manager` to select pnpm, npm, Yarn, or Bun. For example, create a Next.js project with pnpm:

```bash
preset init dashboard --from next-app --package-manager pnpm
```

This selects the package manager that launches the generator. Its prompts, warnings, and update notices appear directly in the terminal.

Without `--package-manager`, Create Preset detects the package manager from the current npm user agent and falls back to npm. Use `--dry-run` to inspect the selected command without launching it:

```bash
preset init dashboard --from next-app --package-manager pnpm --dry-run
```
