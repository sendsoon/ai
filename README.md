# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

SendSoon MCP is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that lets Codex, Claude, Cursor, and other AI agents use [SendSoon](https://sendsoonai.com/) capabilities: send email, look up public IPs, and convert local documents to Markdown.

Configure it once, then describe tasks in natural language. You usually do not need to mention SendSoon in every prompt.

## What you can do

| Tool | Purpose | Example |
| --- | --- | --- |
| `send_email` | Send a single email | “Send me a test email” |
| `ip_lookup` | Look up public IP information | “Look up the location of 8.8.8.8” |
| `markitdown_convert` | Convert a local document to Markdown | “Convert this PDF to Markdown” |

## Packages

Choose **npm (Node)** or **PyPI (Python)** as the MCP runtime. Tool names and environment variables are the same.

| Channel | Package | Requirement |
| --- | --- | --- |
| npm | [`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp) | Node.js 20+ |
| PyPI | [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/) | Python 3.10+; see [`pypi/README.md`](pypi/README.md) |

Client configs start the server with `npx -y @sendsoon/mcp` or `uvx sendsoon-mcp`. A global install is optional.

## Prepare the configuration

All clients use the same environment variables:

| Setting | Required | What to enter |
| --- | --- | --- |
| `SENDSOON_API_KEY` | No | Leave empty for an unregistered trial. One public IP can send up to three free test emails per day. Enter your generated Key for continued use |
| `SENDSOON_API_BASE_URL` | No | Defaults to `https://www.sendsoonai.com`. Set it only to target a different environment |

Never commit a real Key to Git or share it with anyone.

### Get an API Key

1. Sign up or sign in on the [SendSoon registration page](https://sendsoonai.com/login-register).
2. Open [Profile](https://sendsoonai.com/profile) and generate a Key in the API Key section.
3. Copy the one-time `ssk_live_...` Key immediately and enter it as `SENDSOON_API_KEY` in your MCP configuration.
4. Save the configuration and restart your MCP client. Requests with a valid Key do not use the anonymous IP daily quota.

If the anonymous quota is exhausted, `send_email` will tell you to register and configure a Key. An invalid or revoked Key is rejected and does not fall back to the anonymous quota.

## Install in your AI client

### Cursor

Open `Settings > Tools & MCP` in Cursor and add an MCP server. You can also save the following configuration as `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` in your user directory.

**Node (npm):**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

**PyPI:**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "uvx",
      "args": ["sendsoon-mcp"],
      "env": {
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
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

Save the file and reopen Codex. Use `/mcp` to confirm that `sendsoon` is connected. In the desktop app, you can also check `Settings > MCP servers`.

### Claude Code

Replace the placeholder and run:

```powershell
claude mcp add --transport stdio --scope user sendsoon -- npx -y @sendsoon/mcp
```

Run `/mcp` in Claude Code and confirm that `sendsoon` is connected. To use an API Key, add `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>` before the `sendsoon` server name.

### Claude Desktop

Open the configuration file from `Settings > Developer` and add:

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
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
| Arguments | `-y @sendsoon/mcp` |
| Environment | The environment variables listed above |

After installation, restart the client and start a new conversation. Your client may ask for permission the first time a tool runs; approve it to continue.

## Everyday examples

```text
Look up the location and ISP for 8.8.8.8.
```

```text
Convert /path/to/report.pdf to Markdown and summarize the key points.
```

```text
Send an email to user@example.com with the subject “Meeting reminder” and the body “The meeting starts at 3 PM today.”
```

If the agent does not select a tool automatically, say:

```text
Use the sendsoon MCP to complete this task.
```

## Try it in Google Colab

Skip local setup and try `ip_lookup`, `markitdown_convert`, and `send_email` in the browser.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

The notebook calls the same SendSoon HTTP APIs used by these MCP tools.

---

## Visual local testing (MCP Inspector)

To **see all three tools in a browser and click through them manually** before installing into an AI client, use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

Requires Node.js 20+. Run one of the commands below in a terminal; Inspector opens a web UI automatically:

**npm (Node) SendSoon MCP:**

```bash
npx @modelcontextprotocol/inspector npx -y @sendsoon/mcp
```

**PyPI SendSoon MCP:**

```bash
npx @modelcontextprotocol/inspector uvx sendsoon-mcp
```

### How to test

1. Wait for `MCP Inspector Web is up and running` in the terminal. If the browser does not open, paste the `http://127.0.0.1:6274?...` URL from the terminal.
2. Confirm the page header shows **Connected**.
3. Open the **Tools** tab in the top-right area of the page.
4. Select a tool from the list on the left, fill in the parameters, and click **Execute Tool**.
5. Read the response in the **Results** panel on the right. On failure, inspect `error.code` and `error.message`.

### Quick test cases

**IP lookup (`ip_lookup`)**

| Parameter | Value |
| --- | --- |
| `ip` | `8.8.8.8` |

**Send email (`send_email`)**

| Parameter | Value |
| --- | --- |
| `to` | your email address |
| `subject` | `SendSoon MCP test` |
| `body` | `Configuration successful` |

Without `SENDSOON_API_KEY`, one public IP can send up to three free test emails per day.

**File to Markdown (`markitdown_convert`)**

| Parameter | Value |
| --- | --- |
| `file_path` | absolute local path, e.g. `/path/to/report.pdf` |

Supported: `.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.txt` `.md` `.html` `.htm`. Images (`.png`, `.jpg`, etc.) and direct URLs are not supported; save web pages as `.html` first.

Press `Ctrl+C` in the terminal when you are done.

## License

See [LICENSE](LICENSE).
