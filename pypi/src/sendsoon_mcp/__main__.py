"""CLI / module entrypoint for the SendSoon MCP server."""

from __future__ import annotations

import sys


def main() -> None:
    from .server import run

    try:
        run()
    except Exception as error:  # noqa: BLE001 - top-level process boundary
        message = str(error) if str(error) else type(error).__name__
        print(f"[sendsoon] Failed to start MCP server: {message}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
