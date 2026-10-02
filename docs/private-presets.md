# Private presets

Private presets add repository starters or `preset.json` configs to the
interactive catalog. A manifest is validated before the path is saved.

## Bind a manifest

```bash
preset config set /path/to/private-presets.json
```

The path is stored in the user runtime config. Inspect or clear it with:

```bash
preset config get
preset config remove
```

The manifest must be a JSON file with at least one preset. Preset names and
sources must be unique, and every preset must define exactly one of `repo` or
`config`.

If the saved file is missing or invalid during a later `preset init`, a warning
is printed and built-in generators remain available. Run `preset config remove`
to clear the stale path.

## Simple format

Use an array when each entry points directly to a repository or config:

```json
[
  {
    "tech": "python",
    "name": "company-fastapi",
    "desc": "Company FastAPI service",
    "repo": "git@github.com:company/fastapi-preset.git"
  },
  {
    "tech": "ios",
    "name": "company-ios",
    "repo": "https://github.com/company/ios-preset.git#main"
  },
  {
    "tech": "react",
    "name": "company-docs",
    "desc": "Company documentation site",
    "config": "./company-docs.json"
  }
]
```

Relative `config` paths are resolved from the manifest directory. Repository
sources may use `https://`, `http://`, `git@`, or `file://`; append `#branch`
to select a branch. A remote `config` must be an HTTP(S) URL ending in
`.json`.

Every `tech` value becomes a selectable technology stack. No separate
registration is required. Unknown IDs are converted to display labels, so
`company_backend` becomes `Company Backend`. Private entries appear before
built-in official generators in the same stack.

## Versioned manifest

Use the manifest format when a custom stack needs a specific label or brand
color:

```json
{
  "version": 1,
  "techs": {
    "python": {
      "label": "Python",
      "color": "#3776ab"
    },
    "company_backend": {
      "label": "Company Backend",
      "color": "#00add8"
    }
  },
  "presets": [
    {
      "tech": "python",
      "name": "company-fastapi",
      "desc": "Company FastAPI service",
      "repo": "git@github.com:company/fastapi-preset.git"
    }
  ]
}
```

`version` must be `1`. Colors use six-digit hexadecimal values. An invalid or
missing color falls back to the terminal default without blocking project
creation.

## Create a project

Start the interactive flow after binding the manifest:

```bash
preset init company-service
```

The private preset name can also be selected directly:

```bash
preset init company-service --from company-fastapi
```

For a repository preset, Create Preset clones the source, removes the cloned
`.git` directory, and updates `package.json.name` when `package.json` exists.
Other files, including lockfiles, `LICENSE`, and `.github` workflows, are
preserved.

For a `config` entry, the referenced plan controls the checkout and file
transformations. See [Preset configs](preset-configs.md).
