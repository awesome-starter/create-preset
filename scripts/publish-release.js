const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Executed from dist. Dist deliberately has no prepare/build lifecycle scripts.
function publishRelease(root = process.cwd(), run = spawnSync) {
  const { name, version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lookup = run('npm', ['view', `${name}@${version}`, '--json'], { cwd: root, encoding: 'utf8' });
  if (lookup.error) throw lookup.error;
  if (lookup.status === 0) {
    const published = JSON.parse(lookup.stdout);
    const head = run('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    if (head.error || head.status !== 0) throw new Error('Cannot verify release commit');
    if (published.name !== name || published.version !== version || published.gitHead !== head.stdout.trim()) {
      throw new Error(`Existing ${name}@${version} does not match this release commit`);
    }
    console.log(`${name}@${version} already published; completing GitHub release`);
  } else {
    // Fail closed on authentication, network, and registry errors. Only a missing
    // immutable version permits a new publish, including on workflow retries.
    if (!/\bE404\b/.test(lookup.stderr)) throw new Error(lookup.stderr || lookup.stdout);
    const publish = run('npm', ['publish'], { cwd: root, stdio: 'inherit' });
    if (publish.error) throw publish.error;
    if (publish.status !== 0) throw new Error(`npm publish failed with status ${publish.status}`);
  }
}

if (require.main === module) publishRelease();
module.exports = { publishRelease };
