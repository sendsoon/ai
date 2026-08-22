"""send_email MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal

from sendsoon_mcp.validation import validate_send_request

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

ContentType = Literal["text/plain", "text/html"]

TOOL_DESCRIPTION = (
    "Send one test email through SendSoon. The recipient must match SENDSOON_EMAIL_RECIPIENT. "
    "Without SENDSOON_API_KEY, one public IP can send up to 3 free test emails per day; "
    "after that, register on SendSoon, generate an API Key, and configure SENDSOON_API_KEY. "
    "Set content_type to text/html for HTML body."
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="send_email", description=TOOL_DESCRIPTION)
    async def send_email(
        to: str,
        subject: str,
        body: str,
        content_type: ContentType | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        """Send one test email through SendSoon."""
        request = {
            "to": to,
            "subject": subject,
            "body": body,
            "content_type": content_type or "text/plain",
            "idempotency_key": idempotency_key,
        }
        validation_error = validate_send_request(request)
        if validation_error:
            return {"success": False, "error": validation_error.to_dict()}

        return await client.send_email(
            {
                "to": to.strip(),
                "subject": subject.strip(),
                "body": body,
                "content_type": content_type or "text/plain",
                "idempotency_key": idempotency_key,
            }
        )
