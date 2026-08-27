# @sendsoon/mcp

MCP server for [SendSoon](https://www.sendsoonai.com/). Gives Claude, Cursor, Codex, and other MCP clients the ability to send email, look up public IP information, and convert files to Markdown.

**Server name:** `sendsoon`  
**Transport:** `stdio`  
**Tools:** `send_email`, `ip_lookup`, `markitdown_convert`

---

## Install

```bash
npx -y @sendsoon/mcp
```

Optional global install:

```bash
npm install -g @sendsoon/mcp
sendsoon-mcp
```

**Requirements:** Node.js 20+, and a client that supports local stdio MCP servers.

---

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `SENDSOON_API_KEY` | No | Leave empty for anonymous trial: one public IP may send up to **3 test emails per day**. After that, register at [sendsoonai.com](https://sendsoonai.com/login-register), generate an `ssk_live_...` Key at [Profile](https://www.sendsoonai.com/profile), and set it here. |
| `SENDSOON_API_BASE_URL` | No | Defaults to `https://www.sendsoonai.com`. HTTPS required except `http://localhost`. No credentials, query string, or fragment in the URL. |

Never commit a real Key to Git or share it with anyone.

### Get an API Key

1. Sign up or sign in at [sendsoonai.com/login-register](https://sendsoonai.com/login-register).
2. Open [Profile](https://www.sendsoonai.com/profile) and generate a Key.
3. Copy the one-time `ssk_live_...` Key and set `SENDSOON_API_KEY` in your MCP config.
4. Restart the MCP client. Valid Keys do not consume the anonymous daily quota.

If the anonymous quota is exhausted, `send_email` returns an `AUTH_ERROR` asking you to register and configure a Key. Invalid or revoked Keys are rejected and do **not** fall back to anonymous quota.

### Client configuration

**Cursor / Claude Desktop** — save as `.cursor/mcp.json` or `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Claude Code:**

```bash
claude mcp add --transport stdio --scope user \
  sendsoon -- npx -y @sendsoon/mcp
```

**Codex** — add to `~/.codex/config.toml`:

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

**Other clients** (Windsurf, Cline, Continue): Transport `stdio`, command `npx`, args `-y @sendsoon/mcp`, env as above.

---

## For AI agents — how to use this server

Read this section before calling any tool.

### Tool selection

| User intent | Call this tool | Do **not** use for |
| --- | --- | --- |
| Send / test an email | `send_email` | Batch sends, arbitrary recipients, attachments |
| Look up geolocation or ISP of a known IP | `ip_lookup` | Detecting the user's own IP, batch lookups |
| Extract text from a document as Markdown | `markitdown_convert` | Saving files to disk, batch conversion |

### Global rules

1. **Always check `success`** in every tool response before treating the call as successful.
2. On failure, read `error.code` and `error.retryable`. Retry only when `retryable` is `true`.
3. `send_email` accepts the recipient directly in the `to` parameter.
4. `ip_lookup` and `markitdown_convert` do not require an API Key on the public endpoint.
5. One tool call = one email / one IP / one file. No batch endpoints exist.
6. Do not invent parameters not listed in the schema below.

---

## Tool reference

### `send_email`

Send one test email through SendSoon.

**When to call:** User asks to send email, test email, 发邮件, or deliver one message.

**Parameters:**

| Parameter | Required | Constraints |
| --- | --- | --- |
| `to` | Yes | Valid email address. |
| `subject` | Yes | Non-empty, max 998 characters. |
| `body` | Yes | Non-empty, max 512,000 UTF-8 bytes. Plain text or HTML. |
| `content_type` | No | `text/plain` (default) or `text/html`. |
| `idempotency_key` | No | 1–128 chars, `[A-Za-z0-9._:-]+`. Supply on first attempt and reuse when retrying the same logical send. |

**Success response:**

```json
{ "success": true, "remaining": 2 }
```

`remaining` is the anonymous daily allowance left (when no API Key). A `message_id` may appear on production deployments.

**Example — plain text:**

```json
{
  "to": "you@example.com",
  "subject": "SendSoon MCP test",
  "body": "Configuration successful."
}
```

**Example — HTML:**

```json
{
  "to": "you@example.com",
  "subject": "Hello",
  "body": "<p>Hello <strong>there</strong></p>",
  "content_type": "text/html"
}
```

**Tool-specific errors:**

| `error.code` | Meaning | Retry? |
| --- | --- | --- |
| `INVALID_RECIPIENT` | Bad email format | No |
| `INVALID_INPUT` | Empty subject/body, bad `idempotency_key` | No |
| `AUTH_ERROR` | Quota exhausted (register + set Key) or invalid/revoked Key | No |
| `PAYLOAD_TOO_LARGE` | Body exceeds 512 KB UTF-8 | No |

---

### `ip_lookup`

Look up geolocation and ISP info for a public IPv4 or IPv6 address.

**When to call:** User asks to look up, geolocate, or check ISP/ASN for an IP (查IP, IP归属地).

**Parameters:**

| Parameter | Required | Constraints |
| --- | --- | --- |
| `ip` | Yes | Public IPv4 or IPv6. Private, reserved, loopback, link-local, and multicast addresses are **rejected**. |

**Success response:**

```json
{
  "success": true,
  "ip": "8.8.8.8",
  "ip2region": {
    "country": "United States",
    "countryCode": "US",
    "region": "",
    "city": "",
    "postalCode": "",
    "timezone": "",
    "latitude": null,
    "longitude": null
  },
  "network": {
    "isp": "Google LLC",
    "asn": "",
    "organization": "Google LLC"
  },
  "source": "local"
}
```

**Example:**

```json
{ "ip": "8.8.8.8" }
```

**Tool-specific errors:**

| `error.code` | Meaning | Retry? |
| --- | --- | --- |
| `INVALID_INPUT` | Not a valid IP, or not a public address | No |

---

### `markitdown_convert`

Convert a single file to Markdown text.

**When to call:** User wants to convert a PDF/Word/Excel/PPT/text/HTML file to Markdown or extract text (转Markdown, 文件转文本).

**Parameters:**

| Parameter | Required | Constraints |
| --- | --- | --- |
| `file_path` | Yes | Local path to the file to convert. The file name is detected automatically. Max file size **10 MB**. |

**Supported extensions:**

`.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.txt` `.md` `.html` `.htm`

**Not supported:** images (`.png`, `.jpg`, etc.), direct URLs (save as `.html` first), audio, `.zip`, `.epub`, `.csv`, `.json`, `.xml`.

Legacy `.doc` (pre-2007 Word) is **not** supported — ask the user to re-save as `.docx`.

**Success response:**

```json
{
  "success": true,
  "filename": "report.pdf",
  "markdown": "# Report\n\n..."
}
```

The tool returns text only; saving to disk is the caller's responsibility.

**Example:**

```json
{
  "file_path": "/path/to/quarterly-report.pdf"
}
```

**Tool-specific errors:**

| `error.code` | Meaning | Retry? |
| --- | --- | --- |
| `INVALID_INPUT` | Unsupported extension (e.g. images), missing file, empty file, empty conversion result | No |
| `PAYLOAD_TOO_LARGE` | Decoded file > 10 MB | No |

---

## Shared error codes

All tools may return these codes. Always inspect `success` first, then `error.code` and `error.retryable`.

| `error.code` | Typical cause | Retry when `retryable` is true? |
| --- | --- | --- |
| `INVALID_INPUT` | Validation failed | No (always `retryable: false`) |
| `INVALID_RECIPIENT` | Bad email (`send_email` only) | No |
| `INVALID_CONFIG` | Missing env var or bad `SENDSOON_API_BASE_URL` | No |
| `AUTH_ERROR` | Auth failed or quota exhausted | No |
| `PAYLOAD_TOO_LARGE` | Body or file too large | No |
| `RATE_LIMITED` | Rate limit hit | Yes |
| `SERVER_ERROR` | Upstream 5xx | Yes |
| `NETWORK_ERROR` | Connectivity failure | Yes |
| `TIMEOUT` | Request timed out | Yes |
| `INVALID_RESPONSE` | Unexpected API response shape | Yes |

**Retry policy for agents:** If `retryable` is `false`, explain the error to the user and do not retry. For `send_email` retries after uncertain results, reuse the same `idempotency_key`.

---

## Verify the connection

Restart the client, open a new conversation, and ask:

```text
Look up the location and ISP for 8.8.8.8.
```

Success = agent calls `ip_lookup` and returns a result.

To test email (replace with your configured address):

```text
Send a test email to <YOUR_EMAIL> with the subject "SendSoon MCP test" and the body "Configuration successful."
```

Pass the recipient in the `to` parameter of `send_email`.

---

## More documentation

Full user guide (multilingual): [github.com/sendsoon/mcp](https://github.com/sendsoon/mcp) ([简体中文](https://github.com/sendsoon/mcp/blob/main/README.zh-CN.md) · [日本語](https://github.com/sendsoon/mcp/blob/main/README.ja.md))

Try APIs in browser: [Google Colab notebook](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

## License

MIT
