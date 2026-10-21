# Slack to HTML

Forked originally from https://github.com/swiftype/slack-hawk-down & https://github.com/hectorbenitez/slack-to-html

Slack markdown to HTML

## Installation
```
npm install --save slack-to-html
```

## Usage

### Render universal Slack markdown as HTML
```
import { escapeForSlack, escapeForSlackWithMarkdown } from 'slack-hawk-down'

escapeForSlack(':wave:') // => '&#1168;'
escapeForSlackWithMarkdown('`this is a code block`) // => '<span class="slack_code">this is a code block</span>'
```

You can view the rest of the markdown styles [here](https://get.slack.help/hc/en-us/articles/202288908-Format-your-messages)

### Replace Slack user IDs with user names

```
escapeForSlack('<@U123|david> did you see my pull request?', { users: { 'U123': 'david', ... } }) // => '@david did you see my pull request?'
```
You can get a list of the users in your Slack team by requesting [this endpoint](https://api.slack.com/methods/users.list) with a `users:read` scope

### Replace Slack channel IDs with channel names

```
escapeForSlack('<#C123> please fill out this poll', { channels : { '#C123': 'general', ... } }) // => '#general please fill out this poll'
```
You can get a list of the users in your Slack team by requesting [this endpoint](https://api.slack.com/methods/channels.list) with a `channels:read` scope

### Replace Custom Slack emojis

```
escapeForSlack(':facepalm:', { customEmoji: { facepalm: 'http://emojis.slackmojis.com/emojis/images/1450319441/51/facepalm.png', ... } }) // => '<img alt="facepalm" src="http://emojis.slackmojis.com/emojis/images/1450319441/51/facepalm.png" />'
```
You can get a list of custom emoji for your Slack team by requesting [this endpoint](https://api.slack.com/methods/emoji.list) with a `emoji:read` scope

### Replace subteam names (for paid accounts)
```
escapeForSlack('<!subteam^S123>', { usergroups: { 'S123': 'swiftype-eng', ...} }) // => 'swiftype-eng'
```
You can get a list of user groups for your Slack team by requesting [this endpoint](https://api.slack.com/methods/usergroups.list) with a `usergroups:read` scope

## Testing

```
npm test
```

## Upcoming
- Customizeable element and class names for markdown elements

## Releasing to npm from GitHub Actions

`.github/workflows/npm-publish.yml` validates pull requests and publishes stable
GitHub Releases to `@clearfeed-ai/slack-to-html` using npm trusted publishing
(GitHub OIDC). No npm token or GitHub secret is needed. Only the publish job can
request an OIDC token; it publishes the exact tarball built and checked by the
validation job, without installing dependencies or running package scripts.

### One-time activation (package maintainer approval required)

After this workflow is merged, an npm package maintainer must approve and save
the following GitHub Actions connection under
[package settings → Trusted Publisher](https://www.npmjs.com/package/@clearfeed-ai/slack-to-html/access):

| Setting | Value |
| --- | --- |
| Organization or user | `clearfeed` |
| Repository | `slack-to-html` |
| Workflow filename | `npm-publish.yml` |
| Environment name | Leave blank (the workflow does not use a GitHub environment) |
| Allow npm publish | Enabled |
| Allow npm dist-tag | Disabled |

Saving this connection grants this repository/workflow persistent authority to
publish this npm package without a personal npm token or per-release 2FA.
npm also permits `npm stage publish` for every trusted publisher. Existing manual
publishing and package 2FA settings remain unchanged. Treat changes to this
workflow as changes to publishing authority; do not rename it without updating
the npm connection. No additional package access changes are required.

Create the connection when a real next release is ready: npm requires its first
successful publish within two days or the connection expires. Do not release a
dummy version to activate it. See the current
[npm trusted-publishing requirements](https://docs.npmjs.com/trusted-publishers/).

### Each release

1. Merge the reviewed source, `package.json` version bump, and rebuilt `dist/`
   into `master`. Keep the lockfile consistent when changing dependencies.
2. Publish a stable GitHub Release with tag `vX.Y.Z` on that commit. Its version
   must exactly match `package.json`; draft releases and prereleases do not publish.
3. Follow the `Validate and publish npm package` workflow. It rejects unmerged
   release commits, existing versions, and versions that would move `latest`
   backward. It runs lint, the full tests, a reproducible build, and checks the
   packed runtime files and both entry points before publishing.
4. The workflow waits for the public version and `latest` tag, then verifies the
   downloaded tarball matches the validated build. Confirm a clean install of the
   published version. npm can accept a publish before the tarball is publicly
   available; if verification times out, inspect npm processing rather than
   retrying or publishing another version.

CI uses GitHub-hosted `ubuntu-24.04`, Node `24.22.0`, and npm `11.19.1`
(trusted publishing requires Node ≥22.14.0 and npm ≥11.5.1). Actions are pinned
to commit SHAs, release jobs do not use dependency caches, and GitHub checkout
credentials are not persisted.

For deterministic local validation without refreshing upstream emoji data:

```sh
npm ci --ignore-scripts
SLACK_TO_HTML_OFFLINE_EMOJI=1 npm run prepublish
node --test .github/scripts/release.test.cjs
npm pack --ignore-scripts --json > /tmp/slack-to-html-pack.json
node .github/scripts/release.cjs pack /tmp/slack-to-html-pack.json
```

Use `npm run update-emoji` separately when deliberately updating the checked-in
emoji data. Commit its output and rebuilt `dist/` before releasing.

## Contribution
Please open a pull request or issue

## License
MIT
