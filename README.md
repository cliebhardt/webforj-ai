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
<summary><b>OpenAI Codex CLI</b> </summary>

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

Inside a `codex` session, `/plugins` → select `webforj` → press Space to
disable. Then from the shell:

```bash
codex plugin marketplace remove webforj-ai
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
<summary><b>VS Code + GitHub Copilot</b></summary>

Requires GitHub Copilot enabled on your account. VS Code supports both
the MCP server and the skills, but they install separately.

**Install the MCP server**

1. `⌘⇧P` → `MCP: Add Server`
2. Select `HTTP`
3. Paste `https://mcp.webforj.com/mcp`
4. Name the server `webforj-mcp`

Or add it directly to `mcp.json`:

```json
{
  "servers": {
    "webforj-mcp": {
      "type": "http",
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

Open Copilot Chat, switch to **Agent** mode, and type `#webforj-mcp` to
confirm the tools load.

**Install the skills**

VS Code reads skills from `.github/skills/`, `.claude/skills/`, or
`.agents/skills/` in your project (or the `~/.copilot/skills/` global
folder for personal skills). Clone this repo and copy the skill
directories into one of those paths:

```bash
git clone https://github.com/webforj/webforj-ai.git
mkdir -p .github/skills
cp -R webforj-ai/skills/* .github/skills/
```

Alternatively, open VS Code's Chat Customizations (gear icon in chat →
**Skills** tab) to browse and manage installed skills.

**Update**

- MCP server: remote URL, always serves the latest. No action needed.
- Skills: re-copy from the repo:

  ```bash
  cd webforj-ai && git pull
  cp -R skills/* ../.github/skills/
  ```

**Uninstall**

- MCP server: `⌘⇧P` → `MCP: List Servers` → select `webforj-mcp` → Remove.
- Skills: remove copies with:

  ```bash
  rm -rf .github/skills/webforj-*
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

For skills, see [Skills in other clients](#skills-in-other-clients).

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

## Skills in other clients

Beyond the clients listed above, the skills follow the
[Agent Skills](https://agentskills.io) open standard and work in many
more AI coding tools: **Cursor**, **Junie** (JetBrains), **OpenCode**,
**Goose**, **Amp**, **Kiro**, and others. See
[agentskills.io](https://agentskills.io) for the full list.

<details>
<summary>Per-client skill install pointers</summary>

Installation differs per client. The common path is:

1. Clone this repo or copy the `skills/` directory into your project or
   skills folder.
2. Follow your client's skills documentation to register them.

- [Cursor](https://cursor.com/docs/context/skills)
- [Junie](https://junie.jetbrains.com/docs/agent-skills.html)
- [OpenCode](https://opencode.ai/docs/skills/)
- [Goose](https://block.github.io/goose/docs/guides/context-engineering/using-skills/)
- [Kiro](https://kiro.dev/docs/skills/)

</details>

## License

MIT. See [LICENSE](LICENSE).
