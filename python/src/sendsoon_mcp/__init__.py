"""SendSoon MCP server package."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("sendsoon-mcp")
except PackageNotFoundError:  # pragma: no cover - local editable without metadata
    __version__ = "0.1.2"

__all__ = ["__version__"]
