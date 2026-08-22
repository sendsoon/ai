# @sendsoon/mcp-server

MCP server for [SendSoon](https://www.sendsoonai.com/). Gives Claude, Cursor, Codex, and other MCP clients the ability to send email, look up public IP information, and convert files to Markdown.

No install step is required — every configuration below runs the server through `npx`.

| Tool | Purpose | Example prompt |
| --- | --- | --- |
| `send_email` | Send a single email | “Send me a test email” |
| `ip_lookup` | Look up public IP information | “Look up the location of 8.8.8.8” |
| `markitdown_convert` | Convert a file to Markdown | “Convert this PDF to Markdown” |

## Requirements

- Node.js 20 or later
- A client that supports local stdio MCP servers

## Configuration

| Variable | Required | Value |
| --- | --- | --- |
| `SENDSOON_EMAIL_RECIPIENT` | Yes | The recipient address allowed for test sends |
| `SENDSOON_API_KEY` | No | Leave empty for an unregistered trial: one public IP can send up to three free test emails per day. Generate an `ssk_live_...` Key at [Profile](https://www.sendsoonai.com/profile) to keep going |
| `SENDSOON_API_BASE_URL` | No | Defaults to `https://www.sendsoonai.com`. Only set this to target a different environment |

Never commit a real Key to Git or share it with anyone.

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp-server"],
      "env": {
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

In Cursor, save this as `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` in your user directory. In Claude Desktop, open the configuration file from `Settings > Developer`.

### Claude Code

```bash
claude mcp add --transport stdio --scope user \
  --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> \
  sendsoon -- npx -y @sendsoon/mcp-server
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp-server"]

[mcp_servers.sendsoon.env]
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

## Verify

Restart your client, open a new conversation, and ask:

```text
Look up the location and ISP for 8.8.8.8.
```

The connection works if the agent calls `ip_lookup` and returns a result.

## Documentation

Full setup guide, troubleshooting, and error-code reference: [github.com/sendsoon/ai](https://github.com/sendsoon/ai) ([简体中文](https://github.com/sendsoon/ai/blob/main/README.zh-CN.md) · [日本語](https://github.com/sendsoon/ai/blob/main/README.ja.md)).

## License

MIT
