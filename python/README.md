# sendsoon-mcp

MCP server for [SendSoon](https://www.sendsoonai.com/). Gives Claude, Cursor, Codex, and other MCP clients the ability to send email, look up public IP information, and convert files to Markdown.

**PyPI:** [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/)  
**Server name:** `sendsoon`  
**Transport:** `stdio`  
**Tools:** `send_email`, `ip_lookup`, `markitdown_convert`  

Python package version stays aligned with the Node package [`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp). Tool names and request/response semantics stay aligned.

---

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

---

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `SENDSOON_API_KEY` | No | Leave empty for anonymous trial: one public IP may send up to **3 test emails per day**. After that, register at [sendsoonai.com](https://sendsoonai.com/login-register), generate a `ssk_live_...` Key at [Profile](https://www.sendsoonai.com/profile), and set it here. |
| `SENDSOON_API_BASE_URL` | No | Defaults to `https://www.sendsoonai.com`. HTTPS required except `http://localhost`. |

Never commit a real Key to Git or share it with anyone.

Invalid or revoked Keys are rejected and do **not** fall back to the anonymous quota.

---

## Client configuration

### Cursor / Claude Desktop

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

After `pip install sendsoon-mcp`, you can use `"command": "sendsoon-mcp"` with an empty `args` array (or omit `args`).

### Codex

```toml
[mcp_servers.sendsoon]
command = "uvx"
args = ["sendsoon-mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

### Claude Code

```powershell
claude mcp add --transport stdio --scope user sendsoon -- uvx sendsoon-mcp
```

---

## Tools

| Tool | Input highlights | Notes |
| --- | --- | --- |
| `send_email` | `to`, `subject`, `body`, optional `content_type`, `idempotency_key` | Pass the recipient in `to` |
| `ip_lookup` | `ip` | Public IPv4/IPv6 only |
| `markitdown_convert` | `file_path` | Reads a local file, detects the name automatically, and converts it via SendSoon (max 10 MB) |

---

## Development

```bash
cd python
python -m pip install -e ".[dev]"
pytest
ruff check src tests
mypy
```

---

## License

MIT — see [LICENSE](LICENSE).
