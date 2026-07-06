# Example: HTML send with sender alias

## Setup

```bash
export SENDSOON_API_KEY="YOUR_API_KEY"
```

## MCP tool call

Tool: `send_email`

```json
{
  "to": "influencer@example.com",
  "subject": "Partnership intro",
  "body": "<p>Hello,</p><p>We would like to collaborate.</p>",
  "content_type": "text/html",
  "from_alias": "SendSoon Outreach"
}
```

## Notes

- `content_type` must be `text/html` when the body contains HTML tags
- Omit `from_alias` to use the default sender name from your SendSoon account

## Expected result

```json
{
  "success": true,
  "message_id": "msg_..."
}
```
