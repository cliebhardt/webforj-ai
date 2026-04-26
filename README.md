# webforJ AI

The webforJ plugin for AI coding assistants. Bundles the webforJ MCP
server and a curated set of Skills so any MCP capable client can build
and style webforJ applications with up to date knowledge of the
framework.

## Clients

Pick yours. Each section covers install, update, and uninstall.

<details>
<summary><b>Claude Code</b></summary>

**Install**

```bash
claude plugin marketplace add webforj/webforj-ai
claude plugin install webforj@webforj-ai
```

Verify inside Claude Code:

```
/plugin
/mcp
```

The `webforj` plugin appears under Installed. The MCP server appears as
`plugin:webforj:webforj-mcp` under connected servers.

**Update**

Enable auto update for the marketplace from the `/plugin` UI once. From
then on, Claude Code refreshes on launch and pulls new skill content
automatically.

Manual refresh:

```
/plugin marketplace update webforj-ai
/reload-plugins
```

**Uninstall**

```bash
claude plugin uninstall webforj@webforj-ai
claude plugin marketplace remove webforj-ai
```

If you registered the MCP server directly, remove it too:

```bash
claude mcp remove webforj-mcp
```

</details>

<details>
<summary><b>GitHub Copilot CLI</b></summary>

**Install**

```bash
copilot plugin marketplace add webforj/webforj-ai
copilot plugin install webforj@webforj-ai
```

Verify:

```bash
copilot plugin list
```

**Update**

```bash
copilot plugin update webforj
```

**Uninstall**

```bash
copilot plugin uninstall webforj
copilot plugin marketplace remove webforj-ai
```

</details>

<details>
<summary><b>VS Code + GitHub Copilot</b></summary>

**Install**

1. `⌘⇧P` -> `Chat: Install Plugin From Source`
2. Paste `webforj/webforj-ai`

**Update**

```
⌘⇧P -> Chat: Update Plugin -> webforj
```

**Uninstall**

```
⌘⇧P -> Chat: Uninstall Plugin -> webforj
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

**Install**

```bash
gemini extensions install https://github.com/webforj/webforj-ai
```

Verify:

```bash
gemini extensions list
```

**Update**

```bash
gemini extensions update webforj
```

**Uninstall**

```bash
gemini extensions uninstall webforj
```

</details>

<details>
<summary><b>OpenAI Codex CLI</b></summary>

**Install**

```bash
codex plugin marketplace add webforj/webforj-ai
```

Then open a Codex session and enable the plugin:

```bash
codex
```

Inside the TUI, type `/plugins`, select `webforj`, and press **Space** to enable it.

**Invoking skills in Codex.** Codex does not auto load skills by prompt
match the way other clients do. Invoke with the `$<plugin>:<skill>`
syntax:

```
$webforj:webforj-styling-apps explain the DWC color model
$webforj:webforj-creating-components how do I wrap a Custom Element?
```

MCP tools work automatically without the `$` prefix.

**Update**

Codex does not have an `update` command for local path marketplaces.
Remove and re-add:

```bash
codex plugin marketplace remove webforj-ai
codex plugin marketplace add webforj/webforj-ai
```

Then re-enable the plugin from `/plugins` if needed.

**Uninstall**

Inside a `codex` session, `/plugins` -> select `webforj` -> press Space to
disable. Then from the shell:

```bash
codex plugin marketplace remove webforj-ai
```

</details>

<details>
<summary><b>Cursor</b></summary>

**Install the MCP server**

Add to `~/.cursor/mcp.json` (user scope) or `.cursor/mcp.json` (project
scope):

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

Or via the UI: **Settings → Developer → Edit Config → MCP Tools** and
paste the same config.

**Install the skills**

Cursor auto-discovers skills from `~/.cursor/skills/<skill-name>/` (user
scope) or `.cursor/skills/<skill-name>/` (project scope). It also reads
`.agents/skills/`, `.claude/skills/`, and `.codex/skills/` for cross
client compatibility. Clone this repo and copy the skill folders:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p ~/.cursor/skills
cp -R webforj-ai/skills/* ~/.cursor/skills/
```

Or import via Cursor's UI: **Settings → Rules → Add Rule → Remote Rule
(Github)**, then paste a URL pointing to a skill's subdirectory.

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ~/.cursor/skills/
  ```

**Uninstall**

- MCP server: remove the `webforj-mcp` entry from `~/.cursor/mcp.json`.
- Skills:

  ```bash
  rm -rf ~/.cursor/skills/webforj-*
  ```

</details>

<details>
<summary><b>Kiro</b></summary>

**Install the MCP server**

Add to `~/.kiro/settings/mcp.json` (user scope) or
`.kiro/settings/mcp.json` (workspace scope):

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "type": "http",
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

**Install the skills**

Kiro reads skills from `~/.kiro/skills/<skill-name>/` (global) or
`.kiro/skills/<skill-name>/` (workspace). Clone this repo and copy the
skill folders:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p ~/.kiro/skills
cp -R webforj-ai/skills/* ~/.kiro/skills/
```

Or import via Kiro IDE: Agent Steering & Skills section -> **+** ->
**Import a skill** -> **GitHub**, then paste a URL pointing to a skill's
subdirectory in this repo.

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ~/.kiro/skills/
  ```

**Uninstall**

- MCP server: remove the `webforj-mcp` entry from `~/.kiro/settings/mcp.json`.
- Skills:

  ```bash
  rm -rf ~/.kiro/skills/webforj-*
  ```

</details>

<details>
<summary><b>Goose</b></summary>

**Install the MCP server**

Run Goose's interactive configure command and add a remote HTTP
extension:

```bash
goose configure
```

Select `Add Extension` -> `Remote Extension (Streamable HTTP)`. When
prompted:

- Name: `webforj-mcp`
- Streamable HTTP endpoint URI: `https://mcp.webforj.com/mcp`

**Install the skills**

Goose loads skills from `.goose/skills/` (project), `.agents/skills/`
(portable project), or `~/.config/agents/skills/` (global). Clone this
repo and copy the skill folders:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p ~/.config/agents/skills
cp -R webforj-ai/skills/* ~/.config/agents/skills/
```

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ~/.config/agents/skills/
  ```

**Uninstall**

- MCP server: run `goose configure`, select `Remove Extension`, choose
  `webforj-mcp`.
- Skills:

  ```bash
  rm -rf ~/.config/agents/skills/webforj-*
  ```

</details>

<details>
<summary><b>Junie (JetBrains)</b></summary>

**Install the MCP server**

Add to `~/.junie/mcp/mcp.json` (user scope) or `.junie/mcp/mcp.json`
(project scope):

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

**Install the skills**

Junie reads skills from `~/.junie/skills/<skill-name>/` (user scope) or
`<projectRoot>/.junie/skills/<skill-name>/` (project scope). Clone this
repo and copy the skill folders:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p ~/.junie/skills
cp -R webforj-ai/skills/* ~/.junie/skills/
```

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ~/.junie/skills/
  ```

**Uninstall**

- MCP server: remove the `webforj-mcp` entry from `~/.junie/mcp/mcp.json`.
- Skills:

  ```bash
  rm -rf ~/.junie/skills/webforj-*
  ```

</details>

<details>
<summary><b>Antigravity (Google)</b></summary>

**Install the MCP server**

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "serverUrl": "https://mcp.webforj.com/mcp"
    }
  }
}
```

Or via the UI: Agent pane -> **MCP Servers** -> Install a server -> paste
the URL.

**Install the skills**

Antigravity reads skills from `~/.gemini/antigravity/skills/` (global) or
`<workspace-root>/.agents/skills/` (workspace). Clone this repo and copy
the skill folders:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p ~/.gemini/antigravity/skills
cp -R webforj-ai/skills/* ~/.gemini/antigravity/skills/
```

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ~/.gemini/antigravity/skills/
  ```

**Uninstall**

- MCP server: remove the `webforj-mcp` entry from `~/.gemini/antigravity/mcp_config.json`.
- Skills:

  ```bash
  rm -rf ~/.gemini/antigravity/skills/webforj-*
  ```

</details>

<details>
<summary><b>Other MCP Clients</b></summary>

**Install**

Any editor or tool that supports Streamable HTTP MCP servers can
connect. Add this to your client's MCP configuration:

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

**Update**

The MCP server is remote — no action needed.

**Uninstall**

Remove the `webforj-mcp` entry from your client's MCP configuration.

</details>

## Usage

Skills fire automatically when your prompt matches their description:

- *"Wrap this Custom Element library as a webforJ component."*
- *"Style this view with the DWC design tokens and add a dark theme."*
- *"Add login and lock down /admin to admins only."*
- *"Upgrade this project from webforJ 25 to 26."*

MCP tools work automatically in every client:

- *"What webforJ versions are available?"* (uses `get_versions`)
- *"Scaffold a new webforJ sidemenu project called CustomerPortal."* (uses `create_project`)
- *"Search webforJ docs for @Route annotation and navigation."* (uses `search_knowledge_base`)
- *"Show me the full migration guide from the last search result."* (uses `get_document`)
- *"What CSS parts and variables does dwc-button expose?"* (uses `styles_get_component`)
- *"List every --dwc-space-* token."* (uses `styles_list_tokens`)
- *"Validate my app.css - any unknown --dwc-* tokens?"* (uses `styles_validate_tokens`)
- *"Generate a theme from brand color #6366f1."* (uses `create_theme`)

## What's included

The plugin bundles one MCP server and a curated set of skills.

### MCP server

Remote, hosted at `https://mcp.webforj.com/mcp`. Exposes these tools:

| Tool | What it does |
| --- | --- |
| `get_versions` | List the webforJ majors this server knows about, including the current stable, the active SNAPSHOT, and which majors have data available for the styling tools. |
| `create_project` | Return the Maven archetype command (and follow-up commands) that scaffold a new webforJ project. |
| `search_knowledge_base` | Search the indexed docs, JavaDoc, code samples, and Kotlin DSL. Returns ranked snippets with categories. |
| `get_document` | Pull the full content behind a search result, for migration guides, full tutorials, or long API pages. |
| `styles_get_component` | Return the real CSS styling surface of a DWC component — CSS custom properties, shadow parts, reflected attributes, and slots. |
| `styles_list_tokens` | Return the authoritative list of global `--dwc-*` tokens (palette seeds, color shades, spacing, typography, borders). |
| `styles_validate_tokens` | Validate every `--dwc-*` reference in CSS, Java, MDX, or Markdown text and flag invalid tokens with similar-name suggestions. |
| `create_theme` | Generate a webforJ theme from a primary HSL color, including `@AppTheme` / `@StyleSheet` snippets and the full stylesheet. |

### Skills

| Skill | What it does |
| --- | --- |
| [`webforj-adding-servlets`](skills/webforj-adding-servlets/SKILL.md) | Add custom HTTP endpoints to a webforJ app for REST APIs, webhooks, or third-party servlet integrations. Covers Spring REST controllers, remapping webforJ to a sub-path, and proxying custom servlets through the webforJ config for plain and Spring projects. |
| [`webforj-creating-components`](skills/webforj-creating-components/SKILL.md) | Build reusable webforJ components from core components, third-party Web Component libraries, or plain JavaScript libraries. Covers `ElementComposite` wrappers, component extensions, and page-level utilities. |
| [`webforj-handling-timers-and-async`](skills/webforj-handling-timers-and-async/SKILL.md) | Schedule timers, periodic intervals, debounced actions, and background async work using webforJ's thread-safe primitives instead of raw timers or threads. Covers polling, search-as-you-type debouncing, long-running tasks with live progress updates, and async services for plain and Spring projects. |
| [`webforj-localizing-apps`](skills/webforj-localizing-apps/SKILL.md) | Add locale and translation support to a webforJ app. Covers supported locales, browser auto-detect, `messages.properties` bundles, runtime language switching, and custom translation backends for plain and Spring projects. |
| [`webforj-securing-apps`](skills/webforj-securing-apps/SKILL.md) | Protect routes in a webforJ app with login, logout, role-based access, and ownership checks. Covers `@AnonymousAccess`, `@PermitAll`, `@RolesAllowed`, `@DenyAll`, `@RouteAccess` SpEL, and custom evaluators. Routes through the recommended Spring Security integration when Spring Boot is on the classpath, and a custom `RouteSecurityManager` implementation otherwise. |
| [`webforj-styling-apps`](skills/webforj-styling-apps/SKILL.md) | Style and theme webforJ applications using the DWC design-token system (`--dwc-*` CSS custom properties). Covers OKLCH palette configuration, component styling via CSS variables and `::part()`, layout tokens, dark mode, and theme creation. |
| [`webforj-upgrading-versions`](skills/webforj-upgrading-versions/SKILL.md) | Upgrade a webforJ project to a newer major using the official `webforj-rewrite` OpenRewrite recipes (introduced in webforJ 26). Includes a manual fallback for source-target pairs without a published recipe (for example 24 to 25). |

## Contributing

Found a bug, want a new skill, or have a fix to send? Open an issue or a pull request on [github.com/webforj/webforj-ai](https://github.com/webforj/webforj-ai). See [CONTRIBUTING.md](CONTRIBUTING.md) for the maintainer workflow.

## License

MIT. See [LICENSE](LICENSE).
