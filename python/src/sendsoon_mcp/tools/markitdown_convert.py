"""markitdown_convert MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sendsoon_mcp.markitdown_file import load_markitdown_file_from_path

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

TOOL_DESCRIPTION = (
    "Convert a local file (pdf, docx, pptx, xlsx, images, audio, csv, json, html, zip, "
    "epub, txt, etc.) to Markdown text via SendSoon. Provide file_path; the file name is "
    "detected automatically (max 10 MB)."
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="markitdown_convert", description=TOOL_DESCRIPTION)
    async def markitdown_convert(file_path: str) -> dict[str, Any]:
        """Convert a local file to Markdown via SendSoon."""
        request, error = load_markitdown_file_from_path(file_path)
        if error:
            return {"success": False, "error": error.to_dict()}
        assert request is not None
        return await client.markitdown_convert(request)
