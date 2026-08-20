# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

Use [SendSoon](https://sendsoonai.com/) email, IP lookup, and file-to-Markdown capabilities from Codex, Claude, Cursor, and other AI agents.

Configure it once, then describe tasks in natural language. You usually do not need to mention SendSoon in every prompt.

## What you can do

| Tool | Purpose | Example |
| --- | --- | --- |
| `send_email` | Send a single email | “Send me a test email” |
| `ip_lookup` | Look up public IP information | “Look up the location of 8.8.8.8” |
| `markitdown_convert` | Convert a file to Markdown | “Convert this PDF to Markdown” |

## Try it in Google Colab

Skip local setup and try `ip_lookup`, `markitdown_convert`, and `send_email` in the browser.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/ai/blob/main/docs/SendSoon.ipynb)

The notebook calls the same SendSoon HTTP APIs used by these MCP tools. To use them from Cursor, Claude, or Codex, continue with the local MCP setup below.

## Step 1: Install

Requirements:

- Node.js 20 or later
- pnpm 11
- Codex, Claude, Cursor, or another client that supports local stdio MCP servers

Run these commands in a terminal:

```powershell
git clone https://github.com/sendsoon/ai.git
cd ai
pnpm install
pnpm run build
```

After the build finishes, get the absolute path to the MCP entry file.

Windows PowerShell:

```powershell
(Resolve-Path .\mcp\dist\index.js).Path.Replace('\', '/')
```

macOS / Linux:

```bash
realpath ./mcp/dist/index.js
```

Copy the command output and use it to replace `<MCP_ENTRY_PATH>` in the configuration. Enter the full path to the `index.js` file—not the path to the `ai` folder—and do not leave `<MCP_ENTRY_PATH>` unchanged.

For example, if the command prints:

```text
C:/Users/your-name/ai/mcp/dist/index.js
```

Change this:

```json
"args": ["<MCP_ENTRY_PATH>"]
```

to this:

```json
"args": ["C:/Users/your-name/ai/mcp/dist/index.js"]
```

The same applies on macOS / Linux:

```json
"args": ["/Users/your-name/ai/mcp/dist/index.js"]
```

## Step 2: Prepare the configuration

All clients use the same three environment variables:

| Setting | What to enter |
| --- | --- |
| `SENDSOON_API_BASE_URL` | Keep `https://sendsoonai.com` |
| `SENDSOON_EMAIL_RECIPIENT` | Replace `<YOUR_EMAIL>` with your recipient address |
| `SENDSOON_API_KEY` | Leave empty for an unregistered trial. One public IP can send up to three free test emails per day. Enter your generated Key for continued use |

Never commit a real Key to Git or share it with anyone.

### Get an API Key

1. Sign up or sign in on the [SendSoon registration page](https://sendsoonai.com/login-register).
2. Open [Profile](https://sendsoonai.com/profile) and generate a Key in the API Key section.
3. Copy the one-time `ssk_live_...` Key immediately and enter it as `SENDSOON_API_KEY` in your MCP configuration.
4. Save the configuration and restart your MCP client. Requests with a valid Key do not use the anonymous IP daily quota.

If the anonymous quota is exhausted, `send_email` will tell you to register and configure a Key. An invalid or revoked Key is rejected and does not fall back to the anonymous quota.

## Step 3: Choose your client

### Cursor

Open `Settings > Tools & MCP` in Cursor and add an MCP server. You can also save the following configuration as `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` in your user directory:

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["<MCP_ENTRY_PATH>"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

Use only one top-level `mcpServers` object. Save the file, reopen Cursor, and confirm that `sendsoon` is enabled.

### Codex

Open the user configuration file at `~/.codex/config.toml` and add:

```toml
[mcp_servers.sendsoon]
command = "node"
args = ["<MCP_ENTRY_PATH>"]

[mcp_servers.sendsoon.env]
SENDSOON_API_BASE_URL = "https://sendsoonai.com"
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

Save the file and reopen Codex. Use `/mcp` to confirm that `sendsoon` is connected. In the desktop app, you can also check `Settings > MCP servers`.

### Claude Code

Replace the two placeholders and run:

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_API_BASE_URL=https://sendsoonai.com --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> sendsoon -- node "<MCP_ENTRY_PATH>"
```

Run `/mcp` in Claude Code and confirm that `sendsoon` is connected. To use an API Key, add `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>` before the `sendsoon` server name.

### Claude Desktop

Open the configuration file from `Settings > Developer` and add:

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["<MCP_ENTRY_PATH>"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

Save the file, fully quit and restart Claude Desktop, and confirm that `sendsoon` appears in the tool list.

### Other MCP clients

For Windsurf, Cline, Continue, or another client that supports local stdio MCP servers, enter:

| Setting | Value |
| --- | --- |
| Transport | `stdio` |
| Command | `node` |
| Arguments | `<MCP_ENTRY_PATH>` |
| Environment | The three environment variables listed above |

## Confirm that it works

Restart the client, open a new conversation, and enter:

```text
Look up the location and ISP for 8.8.8.8.
```

The MCP connection works if the agent calls `ip_lookup` and returns the result.

To test email, enter:

```text
Send a test email to <YOUR_EMAIL> with the subject “SendSoon MCP test” and the body “Configuration successful.”
```

The address must exactly match `SENDSOON_EMAIL_RECIPIENT`. Your client may ask for permission the first time a tool runs; approve it to continue.

## Everyday examples

```text
Look up information about 1.1.1.1.
```

```text
Convert <YOUR_FILE_PATH> to Markdown and summarize the key points.
```

```text
Send an email to <YOUR_EMAIL> with the subject “Meeting reminder” and the body “The meeting starts at 3 PM today.”
```

If the agent does not select a tool automatically, say:

```text
Use the sendsoon MCP to complete this task.
```

You usually need this explicit instruction only on the first use.

## Official references

- [OpenAI Codex: Model Context Protocol](https://developers.openai.com/codex/mcp)
- [Anthropic: Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor: Model Context Protocol](https://docs.cursor.com/context/model-context-protocol)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See [LICENSE](LICENSE).
