"""FastMCP server wiring for SendSoon tools."""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from .client import SendSoonClient
from .tools import register_tools


def create_server(client: SendSoonClient | None = None) -> FastMCP:
    mcp = FastMCP("sendsoon")
    register_tools(mcp, client or SendSoonClient())
    return mcp


def run() -> None:
    create_server().run(transport="stdio")
