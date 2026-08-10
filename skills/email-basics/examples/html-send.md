# Example: HTML test send

## Setup

```bash
export SENDSOON_EMAIL_RECIPIENT="influencer@example.com"
```

## MCP tool call

Tool: `send_email`

```json
{
  "to": "influencer@example.com",
  "subject": "Partnership intro",
  "body": "<p>Hello,</p><p>We would like to collaborate.</p>",
  "content_type": "text/html"
}
```

## Notes

- `content_type` must be `text/html` when the body contains HTML tags
- `to` must match `SENDSOON_EMAIL_RECIPIENT`

## Expected result

```json
{
  "success": true,
  "remaining": 2
}
```
