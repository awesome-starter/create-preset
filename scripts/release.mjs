import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';
import semver from 'semver';

const logger = { log() {} };
const pluginOptions = { preset: 'conventionalcommits' };
const readText = (file) => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');

export async function nextVersion(current, previous, commits) {
  for (const version of [current, previous].filter(Boolean)) {
    if (!semver.valid(version) || semver.prerelease(version)) {
      throw new Error(`Expected a stable release version, got ${version}`);
    }
  }
  if (previous && semver.lt(current, previous)) {
    throw new Error(`Manifest version ${current} is older than release ${previous}`);
  }
  const type = await analyzeCommits(pluginOptions, { commits, logger });
  // An explicit version ahead of the latest tag is a release floor. In
  // particular, the Rust migration starts at 1.0.0 rather than 0.14.0.
  const candidate = type ? (previous ? semver.inc(previous, type) : '1.0.0') : null;
  if (!previous || semver.gt(current, previous)) {
    return candidate && semver.gt(candidate, current) ? candidate : current;
  }
  return candidate;
}

export function manifestVersion(root) {
  const npm = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const cargo = readText(path.join(root, 'Cargo.toml'))
    .match(/\[package\]([\s\S]*?)(?=\n\[|$)/)?.[1].match(/^version = "([^"]+)"$/m)?.[1];
  const lock = readText(path.join(root, 'Cargo.lock'))
    .match(/\[\[package\]\]\nname = "create-preset"\nversion = "([^"]+)"/)?.[1];
  const npmLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  if (!semver.valid(npm) || cargo !== npm || lock !== npm || npmLock.version !== npm || npmLock.packages[''].version !== npm) {
    throw new Error('package.json, package-lock.json, Cargo.toml and Cargo.lock versions must match');
  }
  return npm;
}

export function applyVersion(root, version, notes, date = new Date().toISOString().slice(0, 10), pendingVersion = version) {
  manifestVersion(root);
  if (!semver.valid(version) || semver.prerelease(version)) throw new Error(`Invalid version ${version}`);
  for (const name of ['package.json', 'package-lock.json']) {
    const file = path.join(root, name);
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    json.version = version;
    if (name === 'package-lock.json') json.packages[''].version = version;
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  }
  const cargo = path.join(root, 'Cargo.toml');
  fs.writeFileSync(cargo, readText(cargo).replace(
    /(\[package\][\s\S]*?\nversion = ")[^"]+(")/, (_, before, after) => `${before}${version}${after}`,
  ));
  const lock = path.join(root, 'Cargo.lock');
  fs.writeFileSync(lock, readText(lock).replace(
    /(\[\[package\]\]\nname = "create-preset"\nversion = ")[^"]+(")/, (_, before, after) => `${before}${version}${after}`,
  ));
  const changelog = path.join(root, 'CHANGELOG.md');
  let previous = readText(changelog).replace(/^## Unreleased[ \t]*\n[\s\S]*?(?=\n#{1,2} \[|$)/, '').trimStart();
  // Replace an unfinished release when retrying, preserving older releases.
  const escaped = pendingVersion.replaceAll('.', '\\.');
  previous = previous.replace(new RegExp(`^## \\[${escaped}\\][^\\n]*\\n[\\s\\S]*?(?=\\n#{1,2} \\[|$)`), '').trimStart();
  fs.writeFileSync(changelog, `## Unreleased\n\n## [${version}](https://github.com/awesome-starter/create-preset/releases/tag/v${version}) (${date})\n\n${notes.trim()}\n\n${previous}`);
  manifestVersion(root);
}

export async function prepare(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const tags = git('tag', '--merged', 'HEAD', '--list', 'v*').split('\n')
    .filter((tag) => semver.valid(tag.slice(1)) && !semver.prerelease(tag.slice(1)));
  tags.sort((a, b) => semver.rcompare(a.slice(1), b.slice(1)));
  const tag = tags[0];
  const records = git('log', '--format=%H%x00%B%x00', tag ? `${tag}..HEAD` : 'HEAD').split('\0');
  const commits = [];
  for (let index = 0; index + 1 < records.length; index += 2) {
    commits.push({ hash: records[index].trim(), message: records[index + 1].trim() });
  }
  const current = manifestVersion(root);
  const version = await nextVersion(current, tag?.slice(1), commits);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_release=${Boolean(version)}\nversion=${version || ''}\n`);
  if (!version) return null;
  const generated = await generateNotes(pluginOptions, {
    cwd: root, env: process.env, commits, logger,
    options: { repositoryUrl: 'https://github.com/awesome-starter/create-preset' },
    lastRelease: tag ? { version: tag.slice(1), gitTag: tag, gitHead: git('rev-list', '-n', '1', tag) } : {},
    nextRelease: { version, gitTag: `v${version}`, gitHead: git('rev-parse', 'HEAD') },
  });
  const changelog = readText(path.join(root, 'CHANGELOG.md'));
  const marker = '<!-- release-notes:commits -->';
  let curated = changelog.match(/^## Unreleased[ \t]*\n([\s\S]*?)(?=\n#{1,2} \[|$)/)?.[1].trim();
  const pendingVersion = !tag || semver.gt(current, tag.slice(1)) ? current : version;
  if (!curated && pendingVersion === current && (!tag || semver.gt(current, tag.slice(1)))) {
    const escaped = current.replaceAll('.', '\\.');
    curated = changelog.match(new RegExp(`^## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,2} \\[|$(?![\\s\\S]))`, 'm'))?.[1].split(marker)[0].trim();
  }
  const history = generated.trim().replace(/^#{1,2} [^\n]*\n+/, '').trim();
  const notes = [curated, marker, history].filter(Boolean).join('\n\n');
  const existingDate = changelog.match(new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\][^\\n]*\\((\\d{4}-\\d{2}-\\d{2})\\)$`, 'm'))?.[1];
  applyVersion(root, version, notes, existingDate, pendingVersion);
  fs.writeFileSync(path.join(root, 'release-notes.md'), `${notes}\n`);
  return version;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (process.argv[2] === 'check') {
    const version = manifestVersion(root);
    if (process.argv[3] && process.argv[3] !== version) throw new Error(`Expected ${process.argv[3]}, found ${version}`);
    console.log(`Release manifests agree on ${version}`);
  } else if (process.argv[2] === 'prepare') {
    console.log((await prepare(root)) || 'No releasable commits');
  } else {
    throw new Error('Usage: node scripts/release.mjs prepare|check [version]');
  }
}
