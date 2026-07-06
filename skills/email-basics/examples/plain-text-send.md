# Example: Plain text send

## Setup

```bash
export SENDSOON_API_KEY="YOUR_API_KEY"
```

## MCP tool call

Tool: `send_email`

```json
{
  "to": "influencer@example.com",
  "subject": "SendSoon Connect test",
  "body": "This is a plain text test message."
}
```

## Expected result

```json
{
  "success": true,
  "message_id": "msg_..."
}
```
