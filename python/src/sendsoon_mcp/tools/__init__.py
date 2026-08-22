"""Tool registration package."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient


def register_tools(mcp: FastMCP, client: SendSoonClient) -> None:
    from .ip_lookup import register as register_ip_lookup
    from .markitdown_convert import register as register_markitdown
    from .send_email import register as register_send_email

    register_send_email(mcp, client)
    register_ip_lookup(mcp, client)
    register_markitdown(mcp, client)
