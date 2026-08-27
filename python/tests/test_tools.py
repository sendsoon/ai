"""Validation and tool-layer contract tests."""

from __future__ import annotations

import base64
import tempfile
from pathlib import Path
from typing import Any

import pytest

from sendsoon_mcp.tools.ip_lookup import register as register_ip_lookup
from sendsoon_mcp.tools.markitdown_convert import register as register_markitdown
from sendsoon_mcp.tools.send_email import register as register_send_email
from sendsoon_mcp.validation import (
    validate_markitdown_filename,
    validate_public_ip,
    validate_send_request,
)


def test_validate_send_request_requires_fields() -> None:
    error = validate_send_request({"to": "bad", "subject": " ", "body": "x"})
    assert error is not None
    assert error.code == "INVALID_RECIPIENT"


def test_validate_public_ip_loopback() -> None:
    error = validate_public_ip("127.0.0.1")
    assert error is not None
    assert error.code == "INVALID_INPUT"


def test_validate_markitdown_extension() -> None:
    error = validate_markitdown_filename("secret.exe")
    assert error is not None
    assert "Unsupported file extension" in error.message


class _FakeClient:
    def __init__(self, result: dict[str, Any]) -> None:
        self.result = result
        self.calls: list[dict[str, Any]] = []

    async def send_email(self, request: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(request)
        return self.result

    async def ip_lookup(self, request: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(request)
        return self.result

    async def markitdown_convert(self, request: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(request)
        return self.result


class _FakeMcp:
    def __init__(self) -> None:
        self.tools: dict[str, Any] = {}

    def tool(self, name: str, description: str):  # noqa: ANN201
        def decorator(fn):  # noqa: ANN001, ANN202
            self.tools[name] = fn
            fn.__tool_description__ = description
            return fn

        return decorator


@pytest.mark.asyncio
async def test_send_email_tool_forwards_trimmed_fields() -> None:
    fake_client = _FakeClient({"success": True, "message_id": "x"})
    mcp = _FakeMcp()
    register_send_email(mcp, fake_client)  # type: ignore[arg-type]
    result = await mcp.tools["send_email"](
        to=" user@example.com ",
        subject=" hi ",
        body="body",
        content_type="text/plain",
        idempotency_key="k1",
    )
    assert result["success"] is True
    assert fake_client.calls[0]["to"] == "user@example.com"
    assert fake_client.calls[0]["subject"] == "hi"


@pytest.mark.asyncio
async def test_ip_lookup_tool_rejects_private() -> None:
    fake_client = _FakeClient({"success": True})
    mcp = _FakeMcp()
    register_ip_lookup(mcp, fake_client)  # type: ignore[arg-type]
    result = await mcp.tools["ip_lookup"](ip="10.0.0.1")
    assert result["success"] is False
    assert fake_client.calls == []


@pytest.mark.asyncio
async def test_markitdown_tool_reads_local_file() -> None:
    fake_client = _FakeClient({"success": True, "filename": "a.md", "markdown": "# a"})
    mcp = _FakeMcp()
    register_markitdown(mcp, fake_client)  # type: ignore[arg-type]

    with tempfile.NamedTemporaryFile("wb", suffix=".pdf", delete=False) as handle:
        handle.write(b"pdf-bytes")
        temp_path = handle.name

    try:
        result = await mcp.tools["markitdown_convert"](file_path=f" {temp_path} ")
    finally:
        Path(temp_path).unlink(missing_ok=True)

    assert result["success"] is True
    assert fake_client.calls[0]["filename"] == Path(temp_path).name
    assert fake_client.calls[0]["content_base64"] == base64.b64encode(b"pdf-bytes").decode("ascii")
