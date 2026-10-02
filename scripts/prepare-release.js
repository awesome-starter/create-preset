#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const binaryNames = [
  'preset-darwin-arm64',
  'preset-darwin-x64',
  'preset-linux-x64',
  'preset-linux-arm64',
  'preset-win-x64.exe',
];

function findBinaries(directory, found = new Map()) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      findBinaries(source, found);
    } else if (entry.isFile() && binaryNames.includes(entry.name)) {
      if (found.has(entry.name)) {
        throw new Error(`Duplicate release binary: ${entry.name}`);
      }
      found.set(entry.name, source);
    }
  }
  return found;
}

function prepareRelease({ binaryDirectory, outputDirectory }) {
  const found = findBinaries(binaryDirectory);
  const missing = binaryNames.filter((name) => !found.has(name));
  if (missing.length) {
    throw new Error(`Missing release binaries: ${missing.join(', ')}`);
  }
  if (fs.existsSync(outputDirectory)) {
    throw new Error(`Release output already exists: ${outputDirectory}`);
  }
  const outputBinaries = path.join(outputDirectory, 'binaries');
  fs.mkdirSync(outputBinaries, { recursive: true });
  for (const [name, source] of found) {
    const destination = path.join(outputBinaries, name);
    fs.copyFileSync(source, destination);
    // Artifact downloads discard executable bits; restore them before packing.
    fs.chmodSync(destination, name.endsWith('.exe') ? 0o644 : 0o755);
  }
  const root = path.join(__dirname, '..');
  for (const name of ['bin', 'schema', 'package.json', 'README.md', 'LICENSE']) {
    fs.cpSync(path.join(root, name), path.join(outputDirectory, name), { recursive: true });
  }
}

if (require.main === module) {
  const root = path.join(__dirname, '..');
  prepareRelease({ binaryDirectory: path.join(root, 'binaries'), outputDirectory: path.join(root, 'dist') });
}

module.exports = { prepareRelease, binaryNames };
