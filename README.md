# webforJ AI

The webforJ plugin for AI coding assistants. Bundles the webforJ MCP
server and a curated set of Skills so any MCP capable client can build
and style webforJ applications with up to date knowledge of the
framework.

## What's Included

- **webforJ MCP server** (remote, hosted at `https://mcp.webforj.com/mcp`)
  - `webforj-create-project`: scaffold a webforJ Maven project from an archetype
  - `webforj-create-theme`: generate DWC color themes from a primary color
  - `webforj-knowledge-base`: semantic search across webforJ docs, JavaDoc, and examples
- **webforj-creating-components** skill: build reusable webforJ components
  from core components, third party Web Component libraries, or plain
  JavaScript libraries.
- **webforj-styling-apps** skill: style and theme webforJ applications
  using the DWC design token system (`--dwc-*` CSS custom properties).

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

In Claude Code, GitHub Copilot CLI, and Gemini CLI, skills fire
automatically when your prompt matches their description:

- *"Wrap this Custom Element library as a webforJ component."*
- *"Style this view with the DWC design tokens and add a dark theme."*

In **Codex**, invoke skills explicitly with the `$<plugin>:<skill>`
syntax:

- *"`$webforj:webforj-styling-apps` explain the DWC color model"*
- *"`$webforj:webforj-creating-components` how do I wrap a Custom Element?"*

MCP tools work automatically in every client:

- *"Scaffold a new webforJ sidemenu project called CustomerPortal."* (uses `webforj-create-project`)
- *"Generate a theme from brand color #6366f1."* (uses `webforj-create-theme`)
- *"Search webforJ docs for @Route annotation and navigation."* (uses `webforj-knowledge-base`)

## License

MIT. See [LICENSE](LICENSE).
