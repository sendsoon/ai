"""SendSoon HTTP API client (protocol-agnostic core, Python port)."""

from __future__ import annotations

import base64
import json
import re
import uuid
from html import escape
from typing import Any
from urllib.parse import quote, unquote

import httpx

from .config import Settings
from .errors import SendSoonError, create_error, map_http_error, map_network_error
from .validation import (
    validate_base_url,
    validate_markitdown_request,
    validate_public_ip,
    validate_send_request,
)

DEFAULT_TIMEOUT = httpx.Timeout(30.0)


def _failure(error: SendSoonError) -> dict[str, Any]:
    return {"success": False, "error": error.to_dict()}


def _success_email(message_id: str | None, remaining: int | None) -> dict[str, Any]:
    result: dict[str, Any] = {"success": True}
    if message_id:
        result["message_id"] = message_id
    if remaining is not None:
        result["remaining"] = remaining
    return result


def _plain_text_to_html(value: str) -> str:
    escaped = escape(value, quote=True)
    return f'<pre style="white-space:pre-wrap;font-family:inherit">{escaped}</pre>'


def _api_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}{path}"


def _auth_headers(api_key: str | None) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"} if api_key else {}


def _parse_send_email_response(body: str) -> dict[str, Any] | None:
    try:
        value = json.loads(body)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict):
        return None

    message_id = value.get("message_id", value.get("id"))
    valid_message_id = isinstance(message_id, str) and bool(message_id.strip())
    valid_success = value.get("success") is True
    if not valid_message_id and not valid_success:
        return None

    data: dict[str, Any] = {}
    if valid_message_id:
        data["message_id"] = message_id
    if isinstance(value.get("remaining"), int):
        data["remaining"] = value["remaining"]
    return data


def _is_string_record(value: Any, keys: list[str]) -> bool:
    return isinstance(value, dict) and all(isinstance(value.get(key), str) for key in keys)


def _parse_ip_lookup_response(body: str) -> dict[str, Any] | None:
    try:
        value = json.loads(body)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict):
        return None
    if not isinstance(value.get("ip"), str) or not isinstance(value.get("source"), str):
        return None

    region_keys = [
        "country",
        "countryCode",
        "region",
        "city",
        "postalCode",
        "timezone",
    ]
    network_keys = ["isp", "asn", "organization"]
    region = value.get("ip2region")
    network = value.get("network")
    if not _is_string_record(region, region_keys) or not _is_string_record(network, network_keys):
        return None

    assert isinstance(region, dict)
    for coordinate in (region.get("latitude"), region.get("longitude")):
        if coordinate is not None and not isinstance(coordinate, (int, float)):
            return None

    return value


def _parse_markitdown_json(body: str) -> dict[str, str] | None:
    try:
        value = json.loads(body)
    except json.JSONDecodeError:
        return None
    if (
        isinstance(value, dict)
        and isinstance(value.get("filename"), str)
        and value["filename"].strip()
        and isinstance(value.get("markdown"), str)
        and value["markdown"].strip()
    ):
        return {"filename": value["filename"], "markdown": value["markdown"]}
    return None


def _response_filename(headers: httpx.Headers, fallback: str) -> str:
    disposition = headers.get("content-disposition", "")
    encoded = re.search(r"filename\*=UTF-8''([^;\s]+)", disposition, flags=re.IGNORECASE)
    if encoded:
        try:
            return unquote(encoded.group(1))
        except Exception:  # noqa: BLE001
            pass

    basic = re.search(r'filename="?([^";]+)"?', disposition, flags=re.IGNORECASE)
    return basic.group(1) if basic else fallback


class SendSoonClient:
    """HTTPS client that only forwards validated requests to SendSoon API."""

    def __init__(
        self,
        settings: Settings | None = None,
        *,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._http_client = http_client
        self._owns_client = http_client is None

    def _resolved_settings(self) -> Settings:
        return self._settings or Settings.from_env()

    async def _client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
            self._owns_client = True
        return self._http_client

    async def aclose(self) -> None:
        if self._owns_client and self._http_client is not None:
            await self._http_client.aclose()
            self._http_client = None

    async def send_email(self, request: dict[str, Any]) -> dict[str, Any]:
        validation_error = validate_send_request(request)
        if validation_error:
            return _failure(validation_error)

        settings = self._resolved_settings()
        config_error = validate_base_url(settings.base_url)
        if config_error:
            return _failure(config_error)
        if not settings.email_recipient:
            return _failure(
                create_error(
                    "INVALID_CONFIG",
                    "Set SENDSOON_EMAIL_RECIPIENT to the only address allowed for test sends.",
                )
            )

        to = str(request["to"]).strip()
        if to.lower() != settings.email_recipient.lower():
            return _failure(
                create_error(
                    "INVALID_RECIPIENT",
                    "Recipient must match SENDSOON_EMAIL_RECIPIENT.",
                )
            )

        subject = str(request["subject"]).strip()
        content_type = request.get("content_type") or "text/plain"
        body = str(request["body"])
        html_content = body if content_type == "text/html" else _plain_text_to_html(body)

        idempotency = request.get("idempotency_key")
        if isinstance(idempotency, str) and idempotency.strip():
            idempotency_key = idempotency.strip()
        else:
            idempotency_key = str(uuid.uuid4())

        payload = {"to": to, "subject": subject, "htmlContent": html_content}
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            **_auth_headers(settings.api_key),
            "Idempotency-Key": idempotency_key,
        }

        try:
            client = await self._client()
            response = await client.post(
                _api_url(settings.base_url, "/api/send-test-email"),
                headers=headers,
                content=json.dumps(payload),
            )
        except httpx.TimeoutException as error:
            return _failure(map_network_error(error))
        except httpx.HTTPError as error:
            return _failure(map_network_error(error))

        if not (200 <= response.status_code < 300):
            return _failure(map_http_error(response.status_code, response.text))

        data = _parse_send_email_response(response.text)
        if not data:
            return _failure(create_error("INVALID_RESPONSE"))
        return _success_email(data.get("message_id"), data.get("remaining"))

    async def ip_lookup(self, request: dict[str, Any]) -> dict[str, Any]:
        ip = str(request.get("ip", "")).strip()
        validation_error = validate_public_ip(ip)
        if validation_error:
            return _failure(validation_error)

        settings = self._resolved_settings()
        config_error = validate_base_url(settings.base_url)
        if config_error:
            return _failure(config_error)

        url = _api_url(settings.base_url, f"/api/ip/lookup?ip={quote(ip, safe='')}")
        try:
            client = await self._client()
            response = await client.get(
                url,
                headers={
                    "Accept": "application/json",
                    **_auth_headers(settings.api_key),
                },
            )
        except httpx.TimeoutException as error:
            return _failure(map_network_error(error))
        except httpx.HTTPError as error:
            return _failure(map_network_error(error))

        if not (200 <= response.status_code < 300):
            return _failure(map_http_error(response.status_code, response.text))

        data = _parse_ip_lookup_response(response.text)
        if not data:
            return _failure(create_error("INVALID_RESPONSE"))

        return {
            "success": True,
            "ip": data["ip"],
            "ip2region": data["ip2region"],
            "network": data["network"],
            "source": data["source"],
        }

    async def markitdown_convert(self, request: dict[str, Any]) -> dict[str, Any]:
        validation_error = validate_markitdown_request(request)
        if validation_error:
            return _failure(validation_error)

        settings = self._resolved_settings()
        config_error = validate_base_url(settings.base_url)
        if config_error:
            return _failure(config_error)

        filename = str(request["filename"]).strip()
        content_base64 = str(request["content_base64"]).strip()
        file_bytes = base64.b64decode(re.sub(r"\s+", "", content_base64), validate=False)

        try:
            client = await self._client()
            response = await client.post(
                _api_url(settings.base_url, "/api/markitdown/convert"),
                headers={
                    "Accept": "text/markdown, application/json",
                    **_auth_headers(settings.api_key),
                },
                files={"file": (filename, file_bytes, "application/octet-stream")},
            )
        except httpx.TimeoutException as error:
            return _failure(map_network_error(error))
        except httpx.HTTPError as error:
            return _failure(map_network_error(error))

        if not (200 <= response.status_code < 300):
            return _failure(map_http_error(response.status_code, response.text))

        data = _parse_markitdown_json(response.text)
        if data:
            return {"success": True, "filename": data["filename"], "markdown": data["markdown"]}

        if not response.text.strip():
            return _failure(create_error("INVALID_RESPONSE"))

        fallback = re.sub(r"\.[^.]+$", "", filename) + ".md"
        return {
            "success": True,
            "filename": _response_filename(response.headers, fallback),
            "markdown": response.text,
        }
