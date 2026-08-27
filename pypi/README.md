# sendsoon-mcp (PyPI)

MCP server for [SendSoon](https://www.sendsoonai.com/). Gives Claude, Cursor, Codex, and other MCP clients the ability to send email, look up public IP information, and convert local documents to Markdown.

**PyPI:** [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/)  
**Server name:** `sendsoon`  
**Transport:** `stdio`  
**Tools:** `send_email`, `ip_lookup`, `markitdown_convert`

Python package version stays aligned with the Node package [`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp). Tool names, titles, parameters, and response semantics stay aligned.

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

### Visual local test (MCP Inspector)

```bash
npx @modelcontextprotocol/inspector uvx sendsoon-mcp
```

Open the **Tools** tab, pick a tool, fill parameters, and click **Execute Tool**. See the root [README](../README.zh-CN.md#本地可视化测试mcp-inspector) for step-by-step instructions.

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

### `send_email` — Send Email

Send one test email through SendSoon. Pass the recipient in `to`.

| Parameter | Required | Notes |
| --- | --- | --- |
| `to` | Yes | Valid email address |
| `subject` | Yes | Non-empty, max 998 characters |
| `body` | Yes | Plain text or HTML; max 512,000 UTF-8 bytes |
| `content_type` | No | `text/plain` (default) or `text/html` |
| `idempotency_key` | No | 1–128 chars, `[A-Za-z0-9._:-]+` |

### `ip_lookup` — IP Lookup

Look up geolocation and ISP info for a public IPv4 or IPv6 address via SendSoon.

| Parameter | Required | Notes |
| --- | --- | --- |
| `ip` | Yes | Public IPv4 or IPv6 only |

### `markitdown_convert` — File to Markdown

Convert a local document to Markdown. Provide `file_path`; the file name is detected automatically (max 10 MB).

| Parameter | Required | Notes |
| --- | --- | --- |
| `file_path` | Yes | Absolute local path to the file |

**Supported extensions:** `.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.txt` `.md` `.html` `.htm`

**Not supported:** images (`.png`, `.jpg`, etc.), direct URLs (save as `.html` first), audio, `.zip`, `.epub`, `.csv`, `.json`, `.xml`.

---

## Development

```bash
cd pypi
python -m pip install -e ".[dev]"
pytest
ruff check src tests
mypy
```

---

## License

MIT — see [LICENSE](LICENSE).
