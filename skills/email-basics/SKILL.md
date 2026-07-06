---
name: email-basics
description: Send a single email through SendSoon via the send_email MCP tool. Use when the user wants to 发邮件, send email, single outreach, test send, or deliver one message to an influencer contact.
---

# Email Basics — send_email

Send one email through SendSoon Connect. This skill covers the `send_email` MCP tool only (not batch campaigns or templates).

## When to use

- User says **发邮件**, **send email**, **发送邮件**, **test send**, or **单封触达**
- After selecting a recipient and you need to deliver one message
- Smoke-test SendSoon integration before batch outreach

## Prerequisites

- MCP server `sendsoon-connect` running with `send_email` registered
- Environment variable `SENDSOON_API_KEY` set (never commit real keys)

## Tool: `send_email`

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `to` | Yes | Recipient email address |
| `subject` | Yes | Email subject |
| `body` | Yes | Plain text or HTML content |
| `content_type` | No | `text/plain` (default) or `text/html` |
| `from_alias` | No | Optional sender display name (max 128 chars). Omit to use account default. |

### Example — plain text

```json
{
  "to": "influencer@example.com",
  "subject": "Collaboration opportunity",
  "body": "Hi, we'd love to explore a partnership with you."
}
```

### Example — HTML

```json
{
  "to": "influencer@example.com",
  "subject": "Hello",
  "body": "<p>Hello <strong>there</strong></p>",
  "content_type": "text/html"
}
```

### Example — custom sender display name

```json
{
  "to": "influencer@example.com",
  "subject": "Outreach",
  "body": "Quick intro from our team.",
  "from_alias": "SendSoon Outreach"
}
```

## Success response

```json
{
  "success": true,
  "message_id": "msg_abc123"
}
```

Save `message_id` if the user asks for delivery tracking later.

## Error handling

Always inspect `success`. On failure, use `error.code` and `error.retryable`:

| `error.code` | Action |
|--------------|--------|
| `INVALID_RECIPIENT` | Fix the email address format |
| `INVALID_INPUT` | Check subject/body are non-empty |
| `AUTH_ERROR` | Verify `SENDSOON_API_KEY` is configured |
| `PAYLOAD_TOO_LARGE` | Shorten the body |
| `RATE_LIMITED` | Wait and retry if `retryable` is true |
| `SERVER_ERROR` / `NETWORK_ERROR` | Retry later if `retryable` is true |

Do not retry automatically when `retryable` is false.

## Examples

- [Plain text send](./examples/plain-text-send.md)
- [HTML send](./examples/html-send.md)

## Out of scope

- Batch sending → use `batch_send` (future skill)
- Template rendering or queue scheduling → handled by SendSoon private API, not this repo
