"""markitdown_convert MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sendsoon_mcp.validation import validate_markitdown_request

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

TOOL_DESCRIPTION = (
    "Convert a file (pdf, docx, pptx, xlsx, images, audio, csv, json, html, zip, epub, txt, etc.) "
    "to Markdown text via SendSoon API. Provide the raw file bytes as base64 (max 10 MB decoded)."
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="markitdown_convert", description=TOOL_DESCRIPTION)
    async def markitdown_convert(filename: str, content_base64: str) -> dict[str, Any]:
        """Convert a file to Markdown via SendSoon API."""
        request = {
            "filename": filename.strip(),
            "content_base64": content_base64.strip(),
        }
        validation_error = validate_markitdown_request(request)
        if validation_error:
            return {"success": False, "error": validation_error.to_dict()}
        return await client.markitdown_convert(request)
