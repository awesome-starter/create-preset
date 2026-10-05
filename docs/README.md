# preset.js.org

The official documentation website for [Create Preset](https://github.com/preset-cli/create-preset), built with the Blackwork docs starter.

The website is maintained in this repository's `docs/` directory. Its source
was imported from `preset-cli/website` at commit `808bc8e`.

## Development

Use Node.js 22.13 or later and the pnpm version pinned in `package.json`.

```bash
cd docs
pnpm install
pnpm dev
```

The development server runs at <http://localhost:3300>.

## Verification

```bash
pnpm test
pnpm lint
pnpm build
pnpm start
```

`pnpm build` writes the static site and Pagefind search index to `.next-static`.
Development and production builds copy `../schema/preset.schema.json` into the
public site, so the CLI and website share one schema source.

## Deployment

The [Pages workflow](../.github/workflows/website.yml) validates pull requests and
deploys documentation changes merged into `main`. Set the repository's
**Settings → Pages → Source** to **GitHub Actions**.

For the move from `preset-cli/website` to `preset-cli/create-preset`, update the
existing `preset` entry in js.org's `cnames_active.js`:

```js
"preset": "preset-cli.github.io/create-preset",
```

When switching the domain, remove `preset.js.org` from the old repository's Pages
settings, then assign it to this repository. Keep the old repository until the
new site is verified. After the DNS update, check both languages, guide links,
search, favicon, and `/schema/preset.schema.json`, then enable HTTPS.

The site uses root-relative asset URLs for `preset.js.org`. Its temporary project
URL is `https://preset-cli.github.io/create-preset/`.
