const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateManifest, validateRelease, validateRegistry, validatePackFiles } = require('./release.cjs');
const manifest = { ...require('../../package.json'), version: '1.2.8' };
const event = { action: 'published', release: { tag_name: `v${manifest.version}`, draft: false, prerelease: false } };
const env = { GITHUB_REPOSITORY: 'clearfeed/slack-to-html', GITHUB_EVENT_NAME: 'release', GITHUB_REF: `refs/tags/v${manifest.version}` };

test('accepts a stable release with the exact package and tag identity', () => {
  assert.equal(validateRelease(manifest, event, env), manifest.version);
});

test('rejects a different package or repository and non-stable versions', () => {
  for (const change of [
    { name: 'slack-to-html' }, { version: '1.2.9-rc.1' }, { version: '01.2.9' },
    { repository: { url: 'git+https://github.com/someone/slack-to-html.git' } }, { private: true },
  ]) assert.throws(() => validateManifest({ ...manifest, ...change }));
});

test('rejects mismatched tags, draft/prereleases, forks, and non-release events', () => {
  for (const release of [
    { ...event.release, tag_name: 'v9.9.9' }, { ...event.release, draft: true }, { ...event.release, prerelease: true },
  ]) assert.throws(() => validateRelease(manifest, { ...event, release }, env));
  for (const change of [
    { GITHUB_REPOSITORY: 'fork/slack-to-html' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_REF: 'refs/heads/master' },
  ]) assert.throws(() => validateRelease(manifest, event, { ...env, ...change }));
});

test('never overwrites a version or moves latest backward', () => {
  const metadata = { name: manifest.name, versions: {}, 'dist-tags': { latest: '1.2.7' } };
  validateRegistry(manifest, metadata);
  assert.throws(() => validateRegistry(manifest, { ...metadata, versions: { [manifest.version]: {} } }));
  for (const latest of [manifest.version, '2.0.0', '1.10.0', '1.2.9', '1.3.0-rc.1']) {
    assert.throws(() => validateRegistry(manifest, { ...metadata, 'dist-tags': { latest } }));
  }
  validateRegistry({ ...manifest, version: '1.10.0' }, { ...metadata, 'dist-tags': { latest: '1.9.9' } });
});

test('rejects missing runtime files, untracked content, and credentials', () => {
  const files = ['package.json', 'dist/index.js', 'dist/browser.js', 'dist/emoji.js'].map(path => ({ path }));
  const tracked = new Set(files.map(entry => entry.path));
  validatePackFiles(files, tracked);
  assert.throws(() => validatePackFiles(files.slice(0, 3), tracked));
  assert.throws(() => validatePackFiles([...files, { path: 'extra.txt' }], tracked));
  for (const path of ['.npmrc', '.env', '.env.local', '.github/workflows/npm-publish.yml', 'node_modules/x/index.js']) {
    assert.throws(() => validatePackFiles([...files, { path }], new Set([...tracked, path])));
  }
});

test('source guard accepts a master commit and rejects a tag on an unmerged branch', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'slack-release-guard-'));
  const script = path.resolve(__dirname, 'release.cjs');
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  try {
    git('init', '-b', 'master');
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(directory, 'event.json'), JSON.stringify(event));
    git('add', 'package.json');
    git('-c', 'user.name=Release guard test', '-c', 'user.email=release-test@example.invalid', 'commit', '-m', 'master fixture');
    const master = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/master', master);
    git('tag', `v${manifest.version}`);
    const run = sha => execFileSync(process.execPath, [script, 'source'], {
      cwd: directory,
      env: { ...process.env, ...env, GITHUB_SHA: sha, GITHUB_EVENT_PATH: path.join(directory, 'event.json') },
      stdio: 'pipe',
    });
    run(master);
    git('checkout', '-b', 'unmerged');
    fs.writeFileSync(path.join(directory, 'unmerged.txt'), 'unmerged');
    git('add', 'unmerged.txt');
    git('-c', 'user.name=Release guard test', '-c', 'user.email=release-test@example.invalid', 'commit', '-m', 'unmerged fixture');
    const unmerged = git('rev-parse', 'HEAD');
    git('tag', '-f', `v${manifest.version}`);
    assert.throws(() => run(unmerged));
    assert.throws(() => run(master));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
