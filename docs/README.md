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

## Social previews

Every canonical page gets Open Graph and X Card metadata from its existing
frontmatter title and description. The build generates a matching 1200 × 630
PNG under `/og/` using a shared text layout and the bundled Noto Sans SC font.
English and Chinese pages have separate previews; `/en/` aliases share the
canonical English preview. No per-page image configuration or image server is
required. Run `pnpm dev` to preview images locally, or inspect the PNG files in
`.next-static/og/` after `pnpm build`.

## Deployment

The [Pages workflow](../.github/workflows/website.yml) validates pull requests and
builds documentation changes merged into `main`. It publishes the static files
to `gh-pages`, retaining the branch's commit history and replacing old files.
Set **Settings → Pages → Source** to **Deploy from a branch**, then select
**gh-pages** and **/(root)**. GitHub Pages deploys the published branch.

The workflow uses the repository's `ACCESS_TOKEN` secret to push the generated
files and trigger the Pages deployment. The token needs write access to this
repository. Pull requests only build and verify the website.

Each build checks the homepages, guide, search index, schema and `CNAME`, and
keeps a `website-static` download artifact for seven days. After publication,
inspect `gh-pages` for `index.html`, `zh/`, `_next/`, `pagefind/`, `schema/`,
`CNAME` and `.nojekyll`. The deployment commit includes the source commit SHA.
Use **Actions → Deploy website → Run workflow → main** to publish manually.

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
