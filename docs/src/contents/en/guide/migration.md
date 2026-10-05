---
title: Migration to 1.0
description: Update commands and template sources for Create Preset 1.0.
order: 5
---

# Migration to 1.0

Version 1.0 removes the remote community and official template lists. Official generators are built in, and private presets are loaded from a local config. Check template names and command options in existing scripts before upgrading.

## Changes to existing commands

| Old usage | What to change |
| --- | --- |
| `--template` | Use `--from` and check that the source name is still available |
| `preset proxy on/off` | Configure network access through the package manager or Git |
| `config --tech` / `localTech` | Add `tech` in the private preset file |
| `preset i` / `preset c` / `preset u` | Use `preset init` / `preset config` / `preset upgrade` |
| `mirror` setting | Configure repository access through Git and registry access through the package manager |
| Remote community starters | Add any template repositories still needed as private presets |

`--from` accepts an official generator ID, private preset name, or JSON config path or URL. Old template names do not map automatically to new sources. Add repositories still needed as [private presets](/guide/private-presets).

Run `preset --list` to check the new source IDs before updating scripts. For example, the official SvelteKit generator uses `svelte`. An unknown `--from` value exits with an error.

Version 1.0 still accepts the hidden `--template` option and prints a migration notice when it is used. Update scripts to use `--from`, then run each command to check the source.
