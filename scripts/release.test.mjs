import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { nextVersion, manifestVersion, applyVersion, prepare } from './release.mjs';
import { publishRelease } from './publish-release.js';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commits = (...messages) => messages.map((message, index) => ({ message, hash: String(index).repeat(40) }));
const readText = (file) => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');

test('Conventional Commits determine patch, minor and breaking releases', async () => {
  assert.equal(await nextVersion('1.0.0', '1.0.0', commits('fix: restore executable permissions')), '1.0.1');
  assert.equal(await nextVersion('1.0.0', '1.0.0', commits('fix: retry', 'feat: add preview')), '1.1.0');
  assert.equal(await nextVersion('1.0.0', '1.0.0', commits('feat!: replace the CLI')), '2.0.0');
  assert.equal(await nextVersion('1.0.0', '1.0.0', commits('refactor: change config\n\nBREAKING CHANGE: new format')), '2.0.0');
  assert.equal(await nextVersion('1.0.0', '1.0.0', commits('docs: explain usage', 'ci: improve checks', 'release: v1.0.0 [skip ci]')), null);
});

test('first Rust release uses 1.0.0 and retries do not bump an unfinished release', async () => {
  assert.equal(await nextVersion('1.0.0', '0.13.1', commits('feat: migrate to Rust')), '1.0.0');
  assert.equal(await nextVersion('1.0.1', '1.0.0', commits('fix: retry release')), '1.0.1');
  assert.equal(await nextVersion('1.0.1', '1.0.0', commits('feat: a new feature during retry')), '1.1.0');
  await assert.rejects(nextVersion('0.13.1', '1.0.0', []), /older/);
  await assert.rejects(nextVersion('1.0.0-beta.1', '1.0.0', []), /stable/);
});

test('website-scoped fixes, features and breaking changes do not release the CLI', async () => {
  const website = commits(
    'fix(website): repair navigation',
    'perf(website): speed up search',
    'feat(website)!: replace the site',
    'feat(website): add a guide\n\nBREAKING CHANGE: new documentation routes',
  );
  assert.equal(await nextVersion('1.0.0', '1.0.0', website), null);
  assert.equal(await nextVersion('1.0.0', '1.0.0', [...website, ...commits('fix: repair CLI generation')]), '1.0.1');
});

function fixture(t) {
  // Keep the fixture under the repo so the preset loader resolves node_modules.
  const root = fs.mkdtempSync(path.join(repository, '.release-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const currentVersion = JSON.parse(readText(path.join(repository, 'package.json'))).version;
  for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'Cargo.toml', 'Cargo.lock']) {
    // Git may check out CRLF on Windows. Seed an LF fixture at a fixed version
    // so its expected release sequence also survives future repository bumps.
    let contents = readText(path.join(repository, file));
    if (file.endsWith('.json')) {
      const manifest = JSON.parse(contents);
      manifest.version = '1.0.0';
      contents = `${JSON.stringify(manifest, null, 2)}\n`;
    } else if (file === 'Cargo.toml') {
      contents = contents.replace(`version = "${currentVersion}"`, 'version = "1.0.0"');
    } else if (file === 'Cargo.lock') {
      contents = contents.replace(`name = "create-preset"\nversion = "${currentVersion}"`, 'name = "create-preset"\nversion = "1.0.0"');
    }
    fs.writeFileSync(path.join(root, file), contents);
  }
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), '## Unreleased\n\n- Rust migration details.\n\n## [0.13.1](old)\n\nOld fixes.\n');
  return root;
}

test('version updates preserve dependency lock entries and move curated notes into the changelog', (t) => {
  const root = fixture(t);
  const pnpmLock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
  const cargoLock = readText(path.join(root, 'Cargo.lock'));
  applyVersion(root, '1.0.1', '- New fixes.', '2026-10-03');
  assert.equal(manifestVersion(root), '1.0.1');
  assert.equal(fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'), pnpmLock);
  assert(!fs.existsSync(path.join(root, 'package-lock.json')));
  assert.equal(fs.readFileSync(path.join(root, 'Cargo.lock'), 'utf8'), cargoLock.replace(/(name = "create-preset"\nversion = ")1.0.0/, '$11.0.1'));
  applyVersion(root, '1.0.1', '- New fixes.', '2026-10-03');
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert.equal((changelog.match(/## \[1.0.1\]/g) || []).length, 1);
  assert.match(changelog, /Old fixes/);
  const cargo = path.join(root, 'Cargo.toml');
  fs.writeFileSync(cargo, fs.readFileSync(cargo, 'utf8').replace('version = "1.0.1"', 'version = "1.0.2"'));
  assert.throws(() => manifestVersion(root), /must match/);
});

test('Windows CRLF manifests keep all versions synchronized', (t) => {
  const root = fixture(t);
  for (const name of ['Cargo.toml', 'Cargo.lock', 'pnpm-lock.yaml', 'CHANGELOG.md']) {
    const file = path.join(root, name);
    fs.writeFileSync(file, readText(file).replaceAll('\n', '\r\n'));
  }
  assert.equal(manifestVersion(root), '1.0.0');
  const pnpmLock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
  applyVersion(root, '2.0.0', '- Breaking changes.');
  assert.equal(manifestVersion(root), '2.0.0');
  assert.equal(fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'), pnpmLock);
});

test('real Git release planning preserves curated migration notes, retries, and ignores released commits', async (t) => {
  const root = fixture(t);
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'release-test@example.com');
  git('config', 'user.name', 'Release Test');
  git('add', '.');
  git('commit', '-m', 'release: old TypeScript version');
  git('tag', 'v0.13.1');
  git('commit', '--allow-empty', '-m', 'feat: migrate to Rust');
  const originalOutput = process.env.GITHUB_OUTPUT;
  delete process.env.GITHUB_OUTPUT;
  t.after(() => { if (originalOutput !== undefined) process.env.GITHUB_OUTPUT = originalOutput; });
  assert.equal(await prepare(root), '1.0.0');
  assert.match(fs.readFileSync(path.join(root, 'release-notes.md'), 'utf8'), /Rust migration details/);
  git('add', '.');
  git('commit', '-m', 'release: v1.0.0 [skip ci]');
  assert.equal(await prepare(root), '1.0.0');
  assert.match(fs.readFileSync(path.join(root, 'release-notes.md'), 'utf8'), /Rust migration details/);
  assert.equal((fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').match(/## \[1.0.0\]/g) || []).length, 1);
  git('add', '.');
  if (git('diff', '--cached', '--name-only')) git('commit', '-m', 'release: retry metadata');
  git('tag', 'v1.0.0');
  git('commit', '--allow-empty', '-m', 'docs: explain Rust');
  assert.equal(await prepare(root), null);
  git('commit', '--allow-empty', '-m', 'fix: restore files');
  assert.equal(await prepare(root), '1.0.1');
  assert.match(fs.readFileSync(path.join(root, 'release-notes.md'), 'utf8'), /restore files/);
  assert.match(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), /Rust migration details/);
  // A new feature before a failed patch finishes must supersede its pending
  // changelog entry rather than claiming the unpublished patch was released.
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace('<!-- release-notes:commits -->', '- Pending patch details.\n\n<!-- release-notes:commits -->'));
  git('add', '.');
  git('commit', '-m', 'release: v1.0.1 [skip ci]');
  git('commit', '--allow-empty', '-m', 'feat: another generator');
  assert.equal(await prepare(root), '1.1.0');
  const newer = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert.doesNotMatch(newer, /## \[1.0.1\]/);
  assert.match(newer, /Pending patch details/);
  assert.match(newer, /## \[1.0.0\]/);
});

test('Git release planning excludes website files and preserves mixed CLI changes', async (t) => {
  const root = fixture(t);
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'release-test@example.com');
  git('config', 'user.name', 'Release Test');
  git('add', '.');
  git('commit', '-m', 'release: v1.0.0');
  git('tag', 'v1.0.0');
  const originalOutput = process.env.GITHUB_OUTPUT;
  delete process.env.GITHUB_OUTPUT;
  t.after(() => { if (originalOutput !== undefined) process.env.GITHUB_OUTPUT = originalOutput; });

  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), '# Website\n');
  fs.writeFileSync(path.join(root, 'docs', '文档.md'), '# Documentation\n');
  git('add', 'docs');
  git('commit', '-m', 'feat!: redesign website');
  fs.mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(root, '.github', 'workflows', 'website.yml'), 'name: Website\n');
  fs.writeFileSync(path.join(root, 'docs', 'content.config.ts'), 'export const content = {};\n');
  git('add', '.github', 'docs');
  git('commit', '-m', 'fix: repair website deployment');
  assert.equal(await prepare(root), null);
  assert(!fs.existsSync(path.join(root, 'release-notes.md')));

  git('checkout', '-b', 'mixed-changes');
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), '# Updated Website\n');
  fs.writeFileSync(path.join(root, 'cli.txt'), 'CLI change\n');
  git('add', 'docs', 'cli.txt');
  git('commit', '-m', 'fix: repair CLI source and website');
  git('checkout', 'main');
  git('merge', '--no-ff', 'mixed-changes', '-m', 'Merge mixed changes');
  assert.equal(await prepare(root), '1.0.1');
  const notes = fs.readFileSync(path.join(root, 'release-notes.md'), 'utf8');
  assert.match(notes, /repair CLI source/);
  assert.doesNotMatch(notes, /redesign website|repair website deployment/);
  assert.match(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), /preset-cli\/create-preset\/releases\/tag\/v1.0.1/);
});

test('publishing retries only accept the same immutable version and commit', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'preset-publish-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'create-preset', version: '1.0.0' }));
  const responses = (...values) => {
    const calls = [];
    return { calls, run(program, args) { calls.push([program, ...args]); assert.ok(values.length); return values.shift(); } };
  };
  const missing = responses({ status: 1, stderr: 'npm error code E404' }, { status: 0 });
  publishRelease(root, missing.run);
  assert.deepEqual(missing.calls[1], ['npm', 'publish']);
  const retry = responses({ status: 0, stdout: JSON.stringify({ name: 'create-preset', version: '1.0.0', gitHead: 'abc' }) }, { status: 0, stdout: 'abc\n' });
  publishRelease(root, retry.run);
  assert.equal(retry.calls.length, 2);
  const conflict = responses({ status: 0, stdout: JSON.stringify({ name: 'create-preset', version: '1.0.0', gitHead: 'other' }) }, { status: 0, stdout: 'abc' });
  assert.throws(() => publishRelease(root, conflict.run), /does not match/);
  const network = responses({ status: 1, stderr: 'ETIMEDOUT' });
  assert.throws(() => publishRelease(root, network.run), /ETIMEDOUT/);
  const failed = responses({ status: 1, stderr: 'E404' }, { status: 1 });
  assert.throws(() => publishRelease(root, failed.run), /publish failed/);
});
