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

- MCP server `sendsoon` running with `send_email` registered
- Environment variable `SENDSOON_EMAIL_RECIPIENT` set to the one address allowed for test sends
- Without `SENDSOON_API_KEY`, one public IP is limited to 3 successful test sends per day. Generate an `ssk_live_...` Key at `https://www.sendsoonai.com/profile` and configure it to continue after the trial.

## Tool: `send_email`

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `to` | Yes | Recipient email address |
| `subject` | Yes | Email subject |
| `body` | Yes | Plain text or HTML content |
| `content_type` | No | `text/plain` (default) or `text/html` |
| `idempotency_key` | No | Stable 1–128 character key for server-side deduplication. Set it before the first attempt and reuse it when retrying the same logical email. |

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

## Success response

```json
{
  "success": true,
  "remaining": 2
}
```

The public test endpoint normally returns the remaining daily allowance rather than a delivery-tracking ID.

The tool generates an idempotency key when one is not supplied, but that generated value is not returned. If a caller may retry after an uncertain result, it should supply a key on the first attempt and reuse it. POST requests are not automatically retried by the client. Deduplication also requires API support for `Idempotency-Key`.

## Error handling

Always inspect `success`. On failure, use `error.code` and `error.retryable`:

| `error.code` | Action |
|--------------|--------|
| `INVALID_RECIPIENT` | Fix the email address format |
| `INVALID_INPUT` | Check subject/body are non-empty |
| `AUTH_ERROR` | If the message says the free quota is exhausted, register and configure `SENDSOON_API_KEY`; otherwise replace an invalid or revoked Key |
| `PAYLOAD_TOO_LARGE` | Shorten the body |
| `RATE_LIMITED` | Wait and retry if `retryable` is true |
| `SERVER_ERROR` / `NETWORK_ERROR` | Retry later if `retryable` is true |
| `TIMEOUT` | The complete request timed out; retry with the same `idempotency_key` |
| `INVALID_RESPONSE` | Service response did not match the API contract; retry later with the same `idempotency_key` |
| `INVALID_CONFIG` | Set `SENDSOON_EMAIL_RECIPIENT`, and ensure `SENDSOON_API_BASE_URL` uses HTTPS except for localhost |

Do not retry automatically when `retryable` is false.

## Examples

- [Plain text send](./examples/plain-text-send.md)
- [HTML send](./examples/html-send.md)

## Out of scope

- Arbitrary-recipient or batch sending → requires a production SendSoon API, not the public test endpoint
- Template rendering or queue scheduling → not exposed by this repository
