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

## Installation

### Claude Code

Add the webforJ marketplace and install the plugin:

```bash
claude plugin marketplace add webforj/webforj-ai
claude plugin install webforj@webforj-ai
```

Verify:

```
/plugin
/mcp
```

The `webforj` plugin appears under Installed. The MCP server appears
as `plugin:webforj:webforj-mcp` under connected servers.

To keep the plugin up to date, enable auto update for the marketplace
from the `/plugin` UI. Claude Code refreshes on launch and pulls new
skill content automatically.

### GitHub Copilot CLI

Add the webforJ marketplace and install the plugin:

```bash
copilot plugin marketplace add webforj/webforj-ai
copilot plugin install webforj@webforj-ai
```

Verify:

```bash
copilot plugin list
```

Update later:

```bash
copilot plugin update webforj
```

### OpenAI Codex CLI

Requires a paid ChatGPT plan (Plus or higher).

```bash
codex plugin marketplace add webforj/webforj-ai
```

Then open a Codex session and enable the plugin from the browser:

```bash
codex
```

Inside the TUI, type `/plugins`, switch to the `webforj-ai` marketplace tab,
select `webforj`, and press Space to enable it.

**Invoking skills in Codex.** Codex does not auto-load skills by prompt
match the way Claude Code and other clients do. To use a skill, prefix
it with `$<plugin>:<skill>`:

```
$webforj:webforj-styling-apps explain the DWC color model
$webforj:webforj-creating-components how do I wrap a Custom Element?
```

MCP tools (`webforj-create-project`, `webforj-create-theme`,
`webforj-knowledge-base`) work automatically without the `$` prefix.

### Gemini CLI

Install the extension directly from GitHub. This registers both the MCP
server and the skills in one command:

```bash
gemini extensions install https://github.com/webforj/webforj-ai
```

Verify:

```bash
gemini extensions list
```

Update later:

```bash
gemini extensions update webforj
```

Uninstall:

```bash
gemini extensions uninstall webforj
```

### VS Code with GitHub Copilot (Agent mode)

Requires GitHub Copilot enabled on your account.

1. `⌘⇧P` -> `MCP: Add Server`
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

Open Copilot Chat, switch to **Agent** mode, and type `#webforj-mcp`
to confirm the tools load.

To get the skills in VS Code too, see the [Skills in other clients](#skills-in-other-clients) section below.

### Other MCP Clients

Any editor or tool that supports Streamable HTTP MCP servers can
connect. Add to your client's MCP configuration:

```json
{
  "mcpServers": {
    "webforj-mcp": {
      "url": "https://mcp.webforj.com/mcp"
    }
  }
}
```

For the skills, see the [Skills in other clients](#skills-in-other-clients) section.

## Skills in other clients

The skills in this plugin follow the [Agent Skills](https://agentskills.io)
open standard, which is natively supported by a wide range of clients
including **VS Code**, **GitHub Copilot**, **Cursor**, **Gemini CLI**,
**OpenAI Codex**, **Junie** (JetBrains), **OpenCode**, **Goose**, **Amp**,
**Kiro**, and more. See [agentskills.io](https://agentskills.io) for the
full list.

Installation differs per client. The common path is:

1. Clone this repo somewhere locally or pull the `skills/` directory
   into your project or skills folder.
2. Follow your client's skills documentation to register them.

Pointers to each client's skills docs:

- [VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [GitHub Copilot](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [Cursor](https://cursor.com/docs/context/skills)
- [Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [OpenAI Codex](https://developers.openai.com/codex/skills/)
- [Junie](https://junie.jetbrains.com/docs/agent-skills.html)
- [OpenCode](https://opencode.ai/docs/skills/)
- [Goose](https://block.github.io/goose/docs/guides/context-engineering/using-skills/)
- [Kiro](https://kiro.dev/docs/skills/)

## Usage

### Skills

In Claude Code, GitHub Copilot CLI, and Gemini CLI, skills fire
automatically when your prompt matches their description:

- *"Wrap this Custom Element library as a webforJ component."*
- *"Style this view with the DWC design tokens and add a dark theme."*
- *"Create a reusable form control that extends ElementComposite."*

In **Codex**, skills are not auto-loaded. Invoke them explicitly with
the `$<plugin>:<skill>` syntax:

- *"`$webforj:webforj-styling-apps` explain the DWC color model"*
- *"`$webforj:webforj-creating-components` how do I wrap a Custom Element?"*

### MCP tools

MCP tools work automatically in every client once the plugin or MCP
server is connected.

- *"Scaffold a new webforJ sidemenu project called CustomerPortal."* (uses `webforj-create-project`)
- *"Generate a theme from brand color #6366f1."* (uses `webforj-create-theme`)
- *"Search webforJ docs for @Route annotation and navigation."* (uses `webforj-knowledge-base`)

## Updates

- **MCP server** is remote, so every session uses the latest tools
  automatically. No action required.
- **Skills** are versioned via this repo. With marketplace auto update
  enabled, new skill content arrives on the next session. Otherwise
  refresh manually:

  ```
  /plugin marketplace update webforj-ai
  /reload-plugins
  ```

  For Copilot CLI:

  ```bash
  copilot plugin update webforj
  ```

## Uninstall

### Claude Code

```bash
claude plugin uninstall webforj@webforj-ai
claude plugin marketplace remove webforj-ai
```

If you registered the MCP server directly, remove it too:

```bash
claude mcp remove webforj-mcp
```

### Copilot CLI

```bash
copilot plugin uninstall webforj
copilot plugin marketplace remove webforj-ai
```

### OpenAI Codex CLI

Inside a `codex` session, `/plugins` → select `webforj` → press Space to disable. Then from the shell:

```bash
codex plugin marketplace remove webforj-ai
```

### Gemini CLI

```bash
gemini extensions uninstall webforj
```

## License

MIT. See [LICENSE](LICENSE).
