"""send_email MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any, Literal

from pydantic import Field

from sendsoon_mcp.validation import validate_send_request

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

ContentType = Literal["text/plain", "text/html"]

TOOL_TITLE = "Send Email"
TOOL_DESCRIPTION = (
    "Send one test email through SendSoon. Pass the recipient in the to parameter. "
    "Without SENDSOON_API_KEY, one public IP can send up to 3 free test emails per day; "
    "after that, register on SendSoon, generate an API Key, and configure SENDSOON_API_KEY. "
    "Set content_type to text/html for HTML body."
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="send_email", title=TOOL_TITLE, description=TOOL_DESCRIPTION)
    async def send_email(
        to: Annotated[str, Field(description="Recipient email address")],
        subject: Annotated[str, Field(description="Email subject line", max_length=998)],
        body: Annotated[
            str,
            Field(description="Email body (plain text or HTML; max 512,000 UTF-8 bytes)"),
        ],
        content_type: Annotated[
            ContentType | None,
            Field(description="MIME content type for body (default: text/plain)"),
        ] = None,
        idempotency_key: Annotated[
            str | None,
            Field(
                description=(
                    "Optional stable key that prevents duplicate delivery when callers retry"
                ),
                max_length=128,
                pattern=r"^[A-Za-z0-9._:-]+$",
            ),
        ] = None,
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
