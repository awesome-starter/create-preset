# Private Presets

Private presets let you create projects from repositories you control. Bind one
JSON file globally:

```bash
preset config set /path/to/private-presets.json
```

The file is validated before it is saved. It must exist, contain at least one
preset, and use unique preset names and repository URLs.

## Simple Format

The array format is the smallest configuration:

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
  }
]
```

Every `tech` value automatically becomes a selectable technology stack. It does
not need to be registered separately. Unknown identifiers are converted to a
display label, for example `company_backend` becomes `Company Backend`.

Private presets are listed before built-in official generators in the same
technology stack.

## Manifest Format

Use the manifest format when a custom technology stack needs a specific label
or brand color:

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

Colors use six-digit hexadecimal values. Invalid or missing colors fall back to
the terminal default without blocking project creation.

## Repository Rules

Supported repository URLs start with `https://`, `http://`, or `git@`. Append a
branch with `#branch-name` when needed:

```json
{
  "repo": "https://github.com/company/project-preset.git#develop"
}
```

When a project is created, `create-preset` removes only the cloned `.git`
directory. Files owned by the preset, including lockfiles, `LICENSE`, and
`.github` workflows, are preserved. If a `package.json` exists, only its `name`
is updated to match the target directory.

## Commands

```bash
preset config get
preset config set /path/to/private-presets.json
preset config remove

preset init my-project --preset company-fastapi
```
