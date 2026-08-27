"""markitdown_convert MCP tool."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from pydantic import Field

from sendsoon_mcp.markitdown_file import load_markitdown_file_from_path

if TYPE_CHECKING:
    from mcp.server.fastmcp import FastMCP

    from sendsoon_mcp.client import SendSoonClient

TOOL_TITLE = "File to Markdown"
TOOL_DESCRIPTION = (
    "Convert a local document to Markdown via SendSoon. Supported: pdf, docx, pptx, xlsx, "
    "xls, txt, md, html, htm. Images (png, jpg, etc.) and direct URLs are not supported. "
    "Provide file_path; the file name is detected automatically (max 10 MB)."
)


def register(mcp: FastMCP, client: SendSoonClient) -> None:
    @mcp.tool(name="markitdown_convert", title=TOOL_TITLE, description=TOOL_DESCRIPTION)
    async def markitdown_convert(
        file_path: Annotated[
            str,
            Field(
                description=(
                    "Local path to the file to convert. The file name is detected automatically."
                ),
            ),
        ],
    ) -> dict[str, Any]:
        """Convert a local file to Markdown via SendSoon."""
        request, error = load_markitdown_file_from_path(file_path)
        if error:
            return {"success": False, "error": error.to_dict()}
        assert request is not None
        return await client.markitdown_convert(request)
