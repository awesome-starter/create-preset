#!/usr/bin/env node

/**
 * Build script for create-preset
 *
 * This script builds the Rust binary for the current platform
 * and copies it to the binaries directory.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
const arch = process.arch;

// Map Node.js platform/arch to binary names
const binaryMap = {
  'darwin-arm64': 'preset-darwin-arm64',
  'darwin-x64': 'preset-darwin-x64',
  'linux-x64': 'preset-linux-x64',
  'linux-arm64': 'preset-linux-arm64',
  'win32-x64': 'preset-win-x64.exe',
};

const key = `${platform}-${arch}`;
const binaryName = binaryMap[key];

if (!binaryName) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  process.exit(1);
}

console.log(`Building for ${platform}-${arch}...`);

// Build the Rust binary
try {
  execSync('cargo build --release', {
    stdio: 'inherit',
  });
} catch (error) {
  console.error('Failed to build Rust binary');
  process.exit(1);
}

// Create binaries directory if it doesn't exist
const binariesDir = path.join(__dirname, '..', 'binaries');
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Copy the binary to the binaries directory
const sourcePath = path.join(
  __dirname,
  '..',
  'target',
  'release',
  platform === 'win32' ? 'preset.exe' : 'preset'
);

const targetPath = path.join(binariesDir, binaryName);

if (!fs.existsSync(sourcePath)) {
  console.error(`Binary not found at ${sourcePath}`);
  process.exit(1);
}

fs.copyFileSync(sourcePath, targetPath);

// Make the binary executable on Unix-like systems
if (platform !== 'win32') {
  fs.chmodSync(targetPath, 0o755);
}

console.log(`✓ Binary built and copied to ${targetPath}`);
console.log(`✓ Build completed successfully!`);
