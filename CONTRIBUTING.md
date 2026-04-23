# Contributing

Maintainer workflow for this repo. End users installing the plugin
should follow [README.md](README.md); this file is for people editing
the source.

### Source of truth

- `skills/` is the single place to edit skill content. Claude Code,
  Copilot CLI, Gemini CLI, and VS Code all read from here directly.
- `.mcp.json` is the single place to define the MCP server connection.
- Per-client plugin manifests live at the path each client expects:
  `.claude-plugin/` (Claude Code), `.github/plugin/` (Copilot CLI),
  `gemini-extension.json` (Gemini CLI) at the repo root, and
  `plugins/webforj/.codex-plugin/` (Codex, subdirectory required).
  Each is authored directly; they do not duplicate each other.

### Why `plugins/webforj/` exists

Codex CLI requires each plugin to be a self-contained subdirectory
under a marketplace root. Other clients (Claude Code, Copilot CLI,
Gemini CLI) read their manifests from the repo root directly.

`plugins/webforj/` holds the Codex plugin bundle:

- `plugins/webforj/.codex-plugin/plugin.json` is the source of truth
  for the Codex plugin manifest. Edit it directly when you need to
  change Codex-specific fields.
- `plugins/webforj/.mcp.json` and `plugins/webforj/skills/` are
  **rebuild artifacts** produced by `scripts/sync.mjs`. Never edit
  these — edit the root versions and run sync.

## Common Tasks

### Edit an existing skill

1. Change files under `skills/<skill-name>/`.
2. Run:

   ```bash
   node scripts/sync.mjs
   ```

3. Commit both the root `skills/` change and the mirrored
   `plugins/webforj/skills/` change.

### Add a new skill

1. Create `skills/<new-skill-name>/SKILL.md` with frontmatter
   (`name`, `description`). Add references and scripts as needed.
2. Run:

   ```bash
   node scripts/sync.mjs
   ```

Claude Code, Copilot CLI, and Gemini CLI auto-discover the new skill
from `skills/`. Codex picks it up from the sync'd copy. No manifest
edits needed.

### Update the MCP server URL

1. Edit `.mcp.json` at the repo root.
2. Run `node scripts/sync.mjs`.
3. Also update `server.json` (`remotes[0].url`) and README snippets if
   the URL appears elsewhere.

### Release a new version

1. Update `CHANGELOG.md` with what's changing under a new `## [X.Y.Z]`
   heading.
2. Bump versions across every manifest:

   ```bash
   node scripts/bump.mjs 0.2.0
   ```

   This updates the `version` field in every manifest that carries one
   (Claude, Copilot, Gemini, Codex, server.json, marketplace.json) and
   auto-runs `sync.mjs` to mirror root `.mcp.json` and `skills/` into
   `plugins/webforj/`.

3. Commit and tag:

   ```bash
   git add -A
   git commit -m "chore(release): 0.2.0"
   git tag v0.2.0
   git push && git push --tags
   ```

### Add support for a new AI client

Most clients follow the Agent Skills open standard, so `skills/` alone
may be enough (they read skills directly from a repo URL or clone).

If the client needs its own manifest:

1. Add the manifest at the path that client expects (research their
   docs).
2. If the manifest has a `version` field, add its path to the
   `targets` array in `scripts/bump.mjs` so future bumps update it.
3. If the client requires a subdirectory layout like Codex, add a new
   mirror entry in `scripts/sync.mjs` and the corresponding
   `plugins/<name>/` subdirectory.
4. Add an "Install" and "Uninstall" section in `README.md`.
