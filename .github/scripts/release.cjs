const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageName = '@clearfeed-ai/slack-to-html';
const repository = 'clearfeed/slack-to-html';
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function validateManifest(manifest) {
  assert.equal(manifest.name, packageName);
  assert.match(manifest.version, stableVersion, 'Only stable X.Y.Z versions can use latest');
  assert.equal(manifest.repository.url, `git+https://github.com/${repository}.git`);
  assert.equal(manifest.main, 'dist/index.js');
  assert.equal(manifest.browser, 'dist/browser.js');
  assert.notEqual(manifest.private, true);
  return manifest.version;
}

function validateRelease(manifest, event, env) {
  const version = validateManifest(manifest);
  assert.equal(env.GITHUB_REPOSITORY, repository);
  assert.equal(env.GITHUB_EVENT_NAME, 'release');
  assert.equal(event.action, 'published');
  assert.equal(event.release.draft, false);
  assert.equal(event.release.prerelease, false);
  assert.equal(event.release.tag_name, `v${version}`);
  assert.equal(env.GITHUB_REF, `refs/tags/v${version}`);
  return version;
}

function validateRegistry(manifest, metadata) {
  const version = validateManifest(manifest);
  assert.equal(metadata.name, packageName);
  assert(metadata.versions && !metadata.versions[version], `Version ${version} is already published`);
  const latest = metadata['dist-tags']?.latest;
  assert.match(latest, stableVersion, 'Registry latest must be a stable version');
  const comparison = version.split('.').map(BigInt);
  const previous = latest.split('.').map(BigInt);
  const difference = comparison.findIndex((part, index) => part !== previous[index]);
  assert(difference >= 0 && comparison[difference] > previous[difference], 'Release must advance latest');
}

function validatePackFiles(files, tracked) {
  for (const entry of files) {
    const name = entry.path;
    assert(tracked.has(name), `Untracked file in package: ${name}`);
    assert(!/(^|\/)(\.github|node_modules|\.npmrc|\.env(?:\..*)?)(\/|$)/.test(name), `Unexpected file: ${name}`);
  }
  for (const required of ['package.json', 'dist/index.js', 'dist/browser.js', 'dist/emoji.js']) {
    assert(files.some(entry => entry.path === required), `Missing package file: ${required}`);
  }
}

function validatePack(manifest, metadata) {
  const version = validateManifest(manifest);
  assert.equal(metadata.length, 1);
  const pack = metadata[0];
  assert.equal(pack.name, packageName);
  assert.equal(pack.version, version);
  assert.equal(pack.filename, `clearfeed-ai-slack-to-html-${version}.tgz`);
  validatePackFiles(pack.files, new Set(git('ls-files').split('\n')));
  const bytes = fs.readFileSync(pack.filename);
  assert.equal(`sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`, pack.integrity);
  for (const entry of pack.files) {
    const packed = execFileSync('tar', ['-xOf', pack.filename, `package/${entry.path}`], { maxBuffer: 10 * 1024 * 1024 });
    assert(packed.equals(fs.readFileSync(entry.path)), `Packed content differs: ${entry.path}`);
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'slack-to-html-pack-'));
  try {
    execFileSync('tar', ['-xzf', path.resolve(pack.filename), '-C', temporary]);
    fs.symlinkSync(path.resolve('node_modules'), path.join(temporary, 'node_modules'), 'dir');
    for (const entry of [manifest.main, manifest.browser]) {
      const api = require(path.join(temporary, 'package', entry));
      assert.equal(api.escapeForSlack(':wave:'), '<span title=":wave:">&#x1F44B;</span>');
      assert.equal(api.escapeForSlackWithMarkdown('```a\nb```', { preformattedCodeBlocks: true }), '<pre><code>a\nb</code></pre>');
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  const outputs = { filename: pack.filename, version, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`).join(''));
  }
  console.log(JSON.stringify(outputs));
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync('package.json'));
  switch (process.argv[2]) {
    case 'source': {
      validateRelease(manifest, JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)), process.env);
      assert.equal(git('rev-parse', 'HEAD'), process.env.GITHUB_SHA, 'Checkout must match the release commit');
      assert.equal(git('rev-parse', `${process.env.GITHUB_REF}^{commit}`), process.env.GITHUB_SHA, 'Tag must resolve to the release commit');
      execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'refs/remotes/origin/master']);
      break;
    }
    case 'registry': {
      const response = await fetch('https://registry.npmjs.org/@clearfeed-ai%2fslack-to-html', { signal: AbortSignal.timeout(30000) });
      assert(response.ok, `Registry lookup failed: ${response.status}`);
      validateRegistry(manifest, await response.json());
      break;
    }
    case 'pack':
      validatePack(manifest, JSON.parse(fs.readFileSync(process.argv[3])));
      break;
    default:
      throw new Error('Expected source, registry, or pack');
  }
}

module.exports = { validateManifest, validateRelease, validateRegistry, validatePackFiles };
if (require.main === module) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
