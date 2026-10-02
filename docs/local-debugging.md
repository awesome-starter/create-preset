# Local verification

These commands exercise the Rust `preset` binary without changing the
repository. Run project creation in a temporary directory so generated files
stay outside the checkout.

## Prerequisites

Official generators require Node.js and one supported package manager. Git is
required for repository-backed private presets and preset configs.

```bash
node --version
npm --version
git --version
```

Create Preset detects the package manager from `npm_config_user_agent`. Pass
`--package-manager npm|yarn|pnpm|bun` when a test must use a specific manager.
Check the selected manager separately when needed, for example
`pnpm --version`.
For a reproducible pnpm 11 run, invoke Corepack explicitly:

```bash
corepack pnpm@11 --version
corepack pnpm@11 create vite
```

## Build the binary

Run from the repository root:

```bash
cargo build --release
```

The binary is:

```text
target/release/preset
```

## Catalog and preview

```bash
target/release/preset --list
target/release/preset init demo --from vite --dry-run
target/release/preset init demo --from ./preset.json --dry-run
```

`--dry-run` prints the creation plan as JSON and does not run external commands
or modify the target. Remote config URLs are fetched and validated. Unknown
`--from` values fail immediately instead of starting an interactive fallback.

`--yes` explicitly allows replacing existing target files without the overwrite
prompt. It does not answer prompts owned by an official generator.

## Interactive flow

```bash
PRESET_ROOT="$(git rev-parse --show-toplevel)"
PRESET_BIN="$PRESET_ROOT/target/release/preset"

mkdir -p /tmp/create-preset-e2e
cd /tmp/create-preset-e2e
"$PRESET_BIN"
```

The initial prompts are:

```text
Project name
Select a tech stack
Select a preset
```

## Locale

Create Preset detects the system locale. Set `PRESET_LANG` to test the bundled
translations without changing system settings:

```bash
PRESET_LANG=en-US "$PRESET_BIN"
PRESET_LANG=zh-CN "$PRESET_BIN"
PRESET_LANG=zh-HK "$PRESET_BIN"
PRESET_LANG=ja-JP "$PRESET_BIN"
```

`zh-CN` and `zh-SG` use Simplified Chinese. `zh-HK`, `zh-TW`, and `zh-MO` use
Traditional Chinese. Unsupported locales fall back to English. Once an
official generator starts, that CLI owns its prompts and locale detection.

Official technology stack colors are built into the CLI. Custom stacks and
private entries come from the private preset configuration. Private entries
appear before official generators in the same stack.

## Direct generator tests

The `--from` value can select an official generator directly. Set the package
manager explicitly to make the command reproducible:

```bash
"$PRESET_BIN" init test-vue --from vue --package-manager pnpm
"$PRESET_BIN" init test-vite --from vite --package-manager pnpm
"$PRESET_BIN" init test-next --from next-app --package-manager pnpm
"$PRESET_BIN" init test-router --from react-router --package-manager pnpm
"$PRESET_BIN" init test-astro --from astro --package-manager pnpm
"$PRESET_BIN" init test-expo --from expo-app --package-manager pnpm
"$PRESET_BIN" init test-svelte --from svelte --package-manager pnpm
```

The selected official CLI owns all following prompts and output. Remove the
projects after checking them:

```bash
rm -rf /tmp/create-preset-e2e/test-vue
rm -rf /tmp/create-preset-e2e/test-vite
rm -rf /tmp/create-preset-e2e/test-next
rm -rf /tmp/create-preset-e2e/test-router
rm -rf /tmp/create-preset-e2e/test-astro
rm -rf /tmp/create-preset-e2e/test-expo
rm -rf /tmp/create-preset-e2e/test-svelte
```

## Preset config test

Develop a local config without using the catalog:

```bash
"$PRESET_BIN" init test-preset \
  --from ../another-project/presets/docs-starter.json
```

The config can select a monorepo subdirectory, exclude files, write files,
apply text and JSON transformations, resolve `workspace:*` dependencies, and
reset the package name. Test the public delivery path with an HTTPS URL:

```bash
"$PRESET_BIN" init test-preset \
  --from https://example.com/preset.json
```

See [Preset configs](preset-configs.md) for the contract and limits.

## Private preset test

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

Run the interactive flow and select Vue. `my-private-vue` appears before the
built-in Vue entries:

```bash
"$PRESET_BIN" init private-demo
```

Change `tech` to a custom value such as `python` to verify that a new
technology stack appears without a separate tech config. Remove the binding
when finished:

```bash
"$PRESET_BIN" config remove
```

## Legacy template message

The legacy option prints a migration notice and resolves the same IDs as
`--from`. Old IDs that are no longer registered now fail with an error:

```bash
"$PRESET_BIN" init old-demo --template vue3-ts-vite
```

## npm wrapper test

From the repository root:

```bash
npm run build
node bin/preset.js --version
node bin/preset.js --help
npm pack --dry-run --json --ignore-scripts
npm run test:package
```

The package dry run should include `bin/preset.js`, the platform binary,
`package.json`, `README.md`, and `LICENSE`.

The package smoke check simulates downloaded artifacts with `644` permissions,
prepares the release layout, creates and installs a real tarball in a temporary
consumer, and runs both installed commands. It verifies the host binary only;
the other artifact names are fixtures for checking package completeness.

## Automated checks

```bash
cargo fmt -- --check
cargo test --all-targets
cargo clippy --all-targets -- -D warnings
cargo build --release
git diff --check
```

CLI regressions use local Git fixtures and package-manager shims, including
`.cmd` shims on Windows. They cover current-directory creation, original-file
restoration, failed transformations, all four package managers, workspace
resolution, catalog listing, and preview without side effects. CI runs these
checks and the npm package smoke on Linux, macOS, and Windows. Live upstream
generator prompts and cross-compiled binaries still need separate acceptance.
