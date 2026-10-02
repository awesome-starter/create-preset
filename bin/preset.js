#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Get the binary name for the current platform
 */
function getBinaryName() {
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
  return binaryMap[key];
}

/**
 * Get the path to the binary
 */
function getBinaryPath() {
  const binaryName = getBinaryName();

  if (!binaryName) {
    return null;
  }

  const binaryPath = path.join(__dirname, '..', 'binaries', binaryName);

  if (!fs.existsSync(binaryPath)) {
    return null;
  }

  return binaryPath;
}

/**
 * Main execution
 */
function main() {
  const binaryPath = getBinaryPath();

  if (!binaryPath) {
    console.error('Error: Unsupported platform or binary not found.');
    console.error(`Platform: ${process.platform}, Arch: ${process.arch}`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (Apple Silicon): darwin-arm64');
    console.error('  - macOS (Intel): darwin-x64');
    console.error('  - Linux (x64): linux-x64');
    console.error('  - Linux (ARM64): linux-arm64');
    console.error('  - Windows (x64): win32-x64');
    console.error('');
    console.error('Please report this issue at:');
    console.error('https://github.com/awesome-starter/create-preset/issues');
    process.exit(1);
  }

  // Execute the binary with all arguments
  const result = spawnSync(binaryPath, process.argv.slice(2), {
    stdio: 'inherit',
    shell: false,
  });

  // Exit with the same code as the binary
  if (result.error) {
    console.error('Error executing binary:', result.error.message);
    process.exit(1);
  }

  if (result.signal) {
    console.error(`Process terminated by signal: ${result.signal}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
