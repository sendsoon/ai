"""Client behavior tests with mocked HTTP."""

from __future__ import annotations

import base64
import json

import httpx
import pytest

from sendsoon_mcp.client import SendSoonClient
from sendsoon_mcp.config import Settings


def _settings(**overrides: object) -> Settings:
    base = {
        "api_key": None,
        "base_url": "https://www.sendsoonai.com",
    }
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_send_email_success(httpx_mock: object) -> None:
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/send-test-email",
        json={"success": True, "message_id": "msg-1", "remaining": 2},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        result = await client.send_email(
            {
                "to": "user@example.com",
                "subject": "Hello",
                "body": "World",
            }
        )
    assert result == {"success": True, "message_id": "msg-1", "remaining": 2}


@pytest.mark.asyncio
async def test_send_email_accepts_any_recipient(httpx_mock: object) -> None:
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/send-test-email",
        json={"success": True, "message_id": "msg-2", "remaining": 2},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        result = await client.send_email(
            {
                "to": "other@example.com",
                "subject": "Hello",
                "body": "World",
            }
        )
    assert result == {"success": True, "message_id": "msg-2", "remaining": 2}


@pytest.mark.asyncio
async def test_send_email_maps_auth_error(httpx_mock: object) -> None:
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/send-test-email",
        status_code=401,
        json={"message": "Invalid API key"},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(api_key="ssk_live_bad"), http_client=http)
        result = await client.send_email(
            {
                "to": "user@example.com",
                "subject": "Hello",
                "body": "World",
            }
        )
    assert result["success"] is False
    assert result["error"]["code"] == "AUTH_ERROR"


@pytest.mark.asyncio
async def test_ip_lookup_success(httpx_mock: object) -> None:
    payload = {
        "ip": "8.8.8.8",
        "ip2region": {
            "country": "United States",
            "countryCode": "US",
            "region": "California",
            "city": "Mountain View",
            "postalCode": "94035",
            "timezone": "America/Los_Angeles",
            "latitude": 37.386,
            "longitude": -122.0838,
        },
        "network": {
            "isp": "Google LLC",
            "asn": "AS15169",
            "organization": "Google Public DNS",
        },
        "source": "sendsoon",
    }
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="GET",
        url="https://www.sendsoonai.com/api/ip/lookup?ip=8.8.8.8",
        json=payload,
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        result = await client.ip_lookup({"ip": "8.8.8.8"})
    assert result["success"] is True
    assert result["ip"] == "8.8.8.8"
    assert result["network"]["asn"] == "AS15169"


@pytest.mark.asyncio
async def test_ip_lookup_rejects_private_ip() -> None:
    client = SendSoonClient(_settings())
    result = await client.ip_lookup({"ip": "192.168.1.1"})
    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_markitdown_convert_json_response(httpx_mock: object) -> None:
    content = base64.b64encode(b"# hello").decode("ascii")
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/markitdown/convert",
        json={"filename": "note.md", "markdown": "# hello"},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        result = await client.markitdown_convert(
            {"filename": "note.txt", "content_base64": content}
        )
    assert result == {"success": True, "filename": "note.md", "markdown": "# hello"}


@pytest.mark.asyncio
async def test_markitdown_convert_plain_markdown_fallback(httpx_mock: object) -> None:
    content = base64.b64encode(b"data").decode("ascii")
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/markitdown/convert",
        text="# converted",
        headers={"content-disposition": 'attachment; filename="out.md"'},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        result = await client.markitdown_convert(
            {"filename": "report.pdf", "content_base64": content}
        )
    assert result["success"] is True
    assert result["filename"] == "out.md"
    assert result["markdown"] == "# converted"


@pytest.mark.asyncio
async def test_invalid_base_url() -> None:
    client = SendSoonClient(_settings(base_url="http://example.com"))
    result = await client.ip_lookup({"ip": "1.1.1.1"})
    assert result["success"] is False
    assert result["error"]["code"] == "INVALID_CONFIG"


def test_settings_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SENDSOON_API_KEY", "  ssk_live_x  ")
    monkeypatch.setenv("SENDSOON_API_BASE_URL", "https://www.sendsoonai.com")
    settings = Settings.from_env()
    assert settings.api_key == "ssk_live_x"
    assert settings.base_url == "https://www.sendsoonai.com"


@pytest.mark.asyncio
async def test_send_request_payload_shape(httpx_mock: object) -> None:
    """Ensure plain-text bodies are wrapped as HTML like the Node client."""
    httpx_mock.add_response(  # type: ignore[attr-defined]
        method="POST",
        url="https://www.sendsoonai.com/api/send-test-email",
        json={"success": True, "message_id": "m1"},
    )
    async with httpx.AsyncClient() as http:
        client = SendSoonClient(_settings(), http_client=http)
        await client.send_email(
            {
                "to": "user@example.com",
                "subject": "S",
                "body": "plain <text>",
                "content_type": "text/plain",
            }
        )
    request = httpx_mock.get_request()  # type: ignore[attr-defined]
    body = json.loads(request.content.decode("utf-8"))
    assert "htmlContent" in body
    assert "&lt;text&gt;" in body["htmlContent"]
