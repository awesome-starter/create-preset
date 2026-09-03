# Local Debugging

These commands test the Rust `preset` binary without modifying the repository.
Use a temporary directory for generated projects.

## Prerequisites

Official generators need Node.js and a package manager. Git is only needed for
private Git presets.

Use the package manager already installed on your machine. There is no need to
force pnpm 11 for normal testing; the generator command is delegated to the
package manager detected from `npm_config_user_agent`.

```bash
node --version
pnpm --version
git --version
```

When a reproducible pnpm 11 run is required, invoke it explicitly with Corepack:

```bash
corepack pnpm@11 --version
corepack pnpm@11 create vite
```

## Build The Binary

Run from the repository root:

```bash
cargo build --release
```

The binary is:

```text
target/release/preset
```

## Interactive Test

```bash
PRESET_ROOT="$(git rev-parse --show-toplevel)"
PRESET_BIN="$PRESET_ROOT/target/release/preset"

mkdir -p /tmp/create-preset-e2e
cd /tmp/create-preset-e2e

"$PRESET_BIN"
```

Expected flow:

```text
Project name
Select a tech stack
Select a preset
```

Official technology stack colors are built into the CLI. Custom technology
stacks come from the private preset configuration. Private presets appear before
official generators.

## Direct Generator Tests

The `--from` value can select an official generator directly. Use
`--package-manager` to make global CLI tests deterministic:

```bash
"$PRESET_BIN" init test-vue --from vue --package-manager pnpm
"$PRESET_BIN" init test-vite --from vite --package-manager pnpm
"$PRESET_BIN" init test-next --from next-app --package-manager pnpm
```

The selected official CLI owns all following prompts and output. Remove test
projects after checking them:

```bash
rm -rf /tmp/create-preset-e2e/test-vue
rm -rf /tmp/create-preset-e2e/test-vite
rm -rf /tmp/create-preset-e2e/test-next
```

## Preset Config Test

Preset authors can bypass the catalog while developing a local JSON file:

```bash
"$PRESET_BIN" init test-preset \
  --from ../another-project/presets/docs-starter.json
```

The config declares a creation plan. Create Preset performs the repository
checkout, selects any monorepo subdirectory, filters and writes files, applies
text and JSON transformations, resolves `workspace:*` package versions, and
resets the package name.

Test the public delivery path with the project's HTTPS URL:

```bash
"$PRESET_BIN" init test-preset \
  --from https://example.com/preset.json
```

## Private Preset Test

Create a local JSON file outside the repository, for example
`/tmp/private-presets.json`:

```json
[
  {
    "tech": "vue",
    "name": "my-private-vue",
    "desc": "My private Vue preset",
    "repo": "git@github.com:your-name/your-private-repo.git"
  }
]
```

Bind and inspect the local configuration:

```bash
"$PRESET_BIN" config set /tmp/private-presets.json
"$PRESET_BIN" config get
```

Run the interactive flow and select Vue. `my-private-vue` should appear before
`Official Vue Starter` and `Nuxt`:

```bash
"$PRESET_BIN" init private-demo
```

Change `tech` to an arbitrary value such as `python` to verify that custom
technology stacks appear without a separate `config --tech` file.

Remove the local binding when finished:

```bash
"$PRESET_BIN" config remove
```

## Legacy Template Message

```bash
"$PRESET_BIN" init old-demo --template vue3-ts-vite
```

The CLI should print the `--template` deprecation notice and then show the
current official/private choices instead of silently switching.

## npm Wrapper Test

From the repository root:

```bash
npm run build
node bin/preset.js --version
node bin/preset.js --help
npm pack --dry-run --json --ignore-scripts
```

The package dry run should include `bin/preset.js`, the platform binary,
`package.json`, `README.md`, and `LICENSE`.

## Automated Checks

```bash
cargo fmt -- --check
cargo test
cargo clippy --all-targets -- -D warnings
cargo build --release
git diff --check
```
