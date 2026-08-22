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

## Install MCP via npm

The MCP server is published as [`@sendsoon/ai`](https://www.npmjs.com/package/@sendsoon/ai). You do not need a global install — clients start it with `npx`, which downloads the package on first use and reuses the cache afterwards.

```bash
npx -y @sendsoon/ai
```

Optional: install the CLI globally if you prefer a local binary:

```bash
npm install -g @sendsoon/ai
sendsoon-mcp
```

Requirements: Node.js 20 or later, and a client that supports local stdio MCP servers (Cursor, Codex, Claude Code, Claude Desktop, etc.).

## Prepare the configuration

All clients use the same environment variables:

| Setting | Required | What to enter |
| --- | --- | --- |
| `SENDSOON_EMAIL_RECIPIENT` | Yes | Replace `<YOUR_EMAIL>` with your recipient address |
| `SENDSOON_API_KEY` | No | Leave empty for an unregistered trial. One public IP can send up to three free test emails per day. Enter your generated Key for continued use |
| `SENDSOON_API_BASE_URL` | No | Defaults to `https://www.sendsoonai.com`. Set it only to target a different environment |

Never commit a real Key to Git or share it with anyone.

### Get an API Key

1. Sign up or sign in on the [SendSoon registration page](https://sendsoonai.com/login-register).
2. Open [Profile](https://sendsoonai.com/profile) and generate a Key in the API Key section.
3. Copy the one-time `ssk_live_...` Key immediately and enter it as `SENDSOON_API_KEY` in your MCP configuration.
4. Save the configuration and restart your MCP client. Requests with a valid Key do not use the anonymous IP daily quota.

If the anonymous quota is exhausted, `send_email` will tell you to register and configure a Key. An invalid or revoked Key is rejected and does not fall back to the anonymous quota.

## Choose your client

### Cursor

Open `Settings > Tools & MCP` in Cursor and add an MCP server. You can also save the following configuration as `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` in your user directory:

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/ai"],
      "env": {
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
command = "npx"
args = ["-y", "@sendsoon/ai"]

[mcp_servers.sendsoon.env]
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

Save the file and reopen Codex. Use `/mcp` to confirm that `sendsoon` is connected. In the desktop app, you can also check `Settings > MCP servers`.

### Claude Code

Replace the placeholder and run:

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> sendsoon -- npx -y @sendsoon/ai
```

Run `/mcp` in Claude Code and confirm that `sendsoon` is connected. To use an API Key, add `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>` before the `sendsoon` server name.

### Claude Desktop

Open the configuration file from `Settings > Developer` and add:

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/ai"],
      "env": {
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
| Command | `npx` |
| Arguments | `-y @sendsoon/ai` |
| Environment | The environment variables listed above |

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

## Install Agent Skills

Agent Skills teach the agent when to call each MCP tool and how to handle error codes. Install the MCP server first, then add skills.

### Claude Code (plugin marketplace)

```text
/plugin marketplace add sendsoon/ai
/plugin install sendsoon-skills@sendsoon
```

### Cursor / Claude (copy skills)

Copy any folder under [`skills/`](skills) into your agent skills directory:

| Client | Project path | User path |
| --- | --- | --- |
| Cursor | `.cursor/skills/<name>/` | `~/.cursor/skills/<name>/` |
| Claude Code | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` |

Available skills: `email-basics`, `ip-lookup`, `markitdown`.

## License

See [LICENSE](LICENSE).
