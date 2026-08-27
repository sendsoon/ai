"""ip_lookup MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from pydantic import Field

from sendsoon_mcp.validation import validate_public_ip

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

TOOL_TITLE = "IP Lookup"
TOOL_DESCRIPTION = (
    "Look up geolocation and ISP info for a public IPv4 or IPv6 address via SendSoon"
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="ip_lookup", title=TOOL_TITLE, description=TOOL_DESCRIPTION)
    async def ip_lookup(
        ip: Annotated[str, Field(description="Public IPv4 or IPv6 address to look up")],
    ) -> dict[str, Any]:
        """Look up public IP geolocation and ISP info."""
        trimmed = ip.strip()
        validation_error = validate_public_ip(trimmed)
        if validation_error:
            return {"success": False, "error": validation_error.to_dict()}
        return await client.ip_lookup({"ip": trimmed})
