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

## Credentials

Set the repository Actions secret `NPM_TOKEN` to a current granular npm access
token with write access to `create-preset` and permission to bypass 2FA for
noninteractive publishing. CI checks authentication before committing release
metadata or building release artifacts. Tokens expire; replace this secret when
necessary. The old token from 2022 cannot be reused after npm's classic-token
revocation.

`GITHUB_TOKEN` handles release commits, tags, and GitHub Releases with
`contents: write`; a separate `ACCESS_TOKEN` is not required. If branch
protection is introduced, allow the release bot to push the generated metadata
commit, or adapt this process to release PRs.

## Retries and manual builds

If a release fails after version preparation, use **Re-run failed jobs** on the
original Rust CI run. This keeps the prepared commit and version. A retry skips
npm publishing only when that version already belongs to the exact same commit,
then completes the GitHub Release. A conflicting published version or registry
error stops the run. If you fix npm credentials before preparation succeeds,
dispatch **Rust CI** on `main` to retry.

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
