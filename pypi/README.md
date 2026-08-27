# sendsoon-mcp

<!-- mcp-name: io.github.sendsoon/mcp -->

MCP server for [SendSoon](https://sendsoonai.com/). Lets Codex and Claude use SendSoon capabilities: send email, look up public IPs, and convert local documents to Markdown.

**PyPI:** [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/)  
**Server name:** `sendsoon`  
**Transport:** `stdio`  
**Tools:** `send_email`, `ip_lookup`, `markitdown_convert`

Configure it once, then describe tasks in natural language. You usually do not need to mention SendSoon in every prompt.

Full guide (multilingual): [github.com/sendsoon/mcp](https://github.com/sendsoon/mcp) ([简体中文](https://github.com/sendsoon/mcp/blob/main/README.zh-CN.md) · [日本語](https://github.com/sendsoon/mcp/blob/main/README.ja.md))

## Install

Recommended (no global install):

```bash
uvx sendsoon-mcp
```

Or install the CLI:

```bash
pip install sendsoon-mcp
sendsoon-mcp
```

**Requirements:** Python 3.10+, and a client that supports local stdio MCP servers.

## What you can do

| Tool | Purpose | Example |
| --- | --- | --- |
| `send_email` | Send a single email | “Send me a test email” |
| `ip_lookup` | Look up public IP information | “Look up the location of 8.8.8.8” |
| `markitdown_convert` | Convert a local document to Markdown | “Convert this PDF to Markdown” |

## Everyday examples

```text
Send an email to user@example.com with the subject “Meeting reminder” and the body “The meeting starts at 3 PM today.”
```

```text
Look up the location and ISP for 8.8.8.8.
```

```text
Convert /path/to/report.pdf to Markdown and summarize the key points.
```

If the agent does not select a tool automatically, say:

```text
Use the sendsoon MCP to complete this task.
```

## Install in your AI client

The instructions below cover **Codex** and **Claude Desktop**.

### Codex

**Config file:** user-level `~/.codex/config.toml` (macOS / Linux) or `%USERPROFILE%\.codex\config.toml` (Windows).

```toml
[mcp_servers.sendsoon]
command = "uvx"
args = ["sendsoon-mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

After `pip install sendsoon-mcp`, you can use `"command": "sendsoon-mcp"` with an empty `args` array instead of `uvx`.

**Verify:** Save the file, restart Codex, and run `/mcp` in a chat. You should see `sendsoon` connected. In the desktop app, also check `Settings > MCP servers`.

**First use:** Start a new conversation and ask for a simple task (e.g. “Look up 8.8.8.8”). Approve the tool if Codex asks for permission.

### Claude Desktop

**Config file:**

| OS | Path |
| --- | --- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

You can also open `Settings > Developer > Edit Config` inside Claude Desktop.

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

**Verify:** Save the file, **fully quit** Claude Desktop (including the system tray), then relaunch. Start a new chat and confirm `sendsoon` tools appear in the tools menu or settings.

**First use:** Claude may ask to approve tool access on the first invocation; allow it to continue.

## Prepare the configuration

Optional environment variable:

| Setting | Required | What to enter |
| --- | --- | --- |
| `SENDSOON_API_KEY` | No | Leave empty for an unregistered trial. One public IP can send up to three free test emails per day. Enter your generated Key for continued use |

Never commit a real Key to Git or share it with anyone.

### Get an API Key

1. Sign up or sign in on the [SendSoon registration page](https://sendsoonai.com/login-register).
2. Open [Profile](https://sendsoonai.com/profile) and generate a Key in the API Key section.
3. Copy the one-time `ssk_live_...` Key immediately and enter it as `SENDSOON_API_KEY` in your MCP configuration.
4. Save the configuration and restart your MCP client. Requests with a valid Key do not use the anonymous IP daily quota.

If the anonymous quota is exhausted, `send_email` will tell you to register and configure a Key. An invalid or revoked Key is rejected and does not fall back to the anonymous quota.

## Try it in Google Colab

Skip local setup and try `ip_lookup`, `markitdown_convert`, and `send_email` in the browser.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

The notebook calls the same SendSoon HTTP APIs used by these MCP tools.

---

## Visual local testing (MCP Inspector)

To **see all three tools in a browser and click through them manually** before installing into an AI client, use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

Requires Node.js 20+ (for Inspector). Run the command below in a terminal; Inspector opens a web UI automatically:

```bash
npx @modelcontextprotocol/inspector uvx sendsoon-mcp
```

### How to test

1. Wait for `MCP Inspector Web is up and running` in the terminal. If the browser does not open, paste the `http://127.0.0.1:6274?...` URL from the terminal.
2. Confirm the page header shows **Connected**.
3. Open the **Tools** tab in the top-right area of the page.
4. Select a tool from the list on the left, fill in the parameters, and click **Execute Tool**.
5. Read the response in the **Results** panel on the right. On failure, inspect `error.code` and `error.message`.

## Development

```bash
cd pypi
python -m pip install -e ".[dev]"
pytest
ruff check src tests
mypy
```

## License

MIT — see [LICENSE](../LICENSE).
