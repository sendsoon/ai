# Example: Plain text send

## Setup

```bash
export SENDSOON_EMAIL_RECIPIENT="influencer@example.com"
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
  "remaining": 2
}
```
