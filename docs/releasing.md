# Releasing

Merging into `main` starts Rust CI on Linux, macOS, and Windows. Once all
checks pass, CI uses semantic-release's commit analyzer and release-notes
generator with the Conventional Commits preset to choose the next version:

- `fix:` and `perf:` produce a patch release.
- `feat:` produces a minor release.
- `!` or a `BREAKING CHANGE:` footer produces a major release.
- Documentation, tests, CI, and maintenance commits alone do not publish.

The first Rust release is `1.0.0`, already selected in the manifests. An explicit
manifest version ahead of the latest stable tag acts as a minimum release
version. npm and Cargo versions must agree before release planning.

CI updates `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock`, and
`CHANGELOG.md`, then pushes a `release: v… [skip ci]` commit to `main`. Curated
`Unreleased` notes are preserved in the version's changelog entry. A reusable
workflow validates that exact commit, builds all five supported binaries, and
publishes one npm package and a GitHub Release tagged at that commit. The
workflow calls the build directly: a tag created with `GITHUB_TOKEN` does not
start another Actions run.

## Trusted publishing

Publishing uses npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/)
with GitHub Actions OIDC. No `NPM_TOKEN` or 2FA-bypass access token is needed.
In the `create-preset` package's npm Settings, add a GitHub Actions trusted
publisher with these values:

| Field | Value |
| --- | --- |
| Organization or user | `awesome-starter` |
| Repository | `create-preset` |
| Workflow filename | `release.yml` |
| Environment name | Leave empty |
| Allowed actions | Enable direct publishing with `npm publish` |

Use `release.yml` for automatic releases: npm validates the calling workflow
when a reusable workflow performs the publish. To also publish manually pushed
tags, add a second trusted publisher with the same values but the workflow
filename `build-binaries.yml`. Only enter the filename, without the directory.

The calling publish job and the reusable release job both grant `id-token:
write`. Publishing runs on a GitHub-hosted Ubuntu runner using Node.js 22 and
npm 11, meeting npm's minimum requirements of Node.js 22.14.0 and npm 11.5.1.
OIDC authentication happens during `npm publish`; `npm whoami` cannot validate
trusted publishing permissions. Configuration can only be fully verified by a
real CI publish.

`GITHUB_TOKEN` handles release commits, tags, and GitHub Releases with
`contents: write`; a separate `ACCESS_TOKEN` is not required. If branch
protection is introduced, allow the release bot to push the generated metadata
commit, or adapt this process to release PRs.

## Retries and manual builds

If a release fails after version preparation, use **Re-run failed jobs** on the
original Rust CI run. This keeps the prepared commit and version. A retry skips
npm publishing only when that version already belongs to the exact same commit,
then completes the GitHub Release. A conflicting published version or registry
error stops the run. If authentication fails, correct the npm trusted publisher
configuration and rerun the failed jobs on the original Rust CI run.

Dispatching **Build Binaries** builds and validates without publishing.
An explicitly pushed `v*` tag also publishes; its version must match all
manifests. Routine releases only need the merge into `main`.

## Local checks

Release tooling requires Node.js 22. The installed CLI's Node.js requirement
remains unchanged.

```bash
npm ci --ignore-scripts
npm run test:release
node scripts/release.mjs check
```

Release tests use local Git fixtures and mock registry responses. They cover
version decisions, breaking changes, initial `1.0.0`, manifest synchronization,
Windows line endings, changelog preservation, and publishing retries. They do
not create real tags or publish packages.
