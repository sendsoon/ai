"""Request validation helpers (aligned with npm/src/core)."""

from __future__ import annotations

import base64
import binascii
import ipaddress
import re
from typing import Any
from urllib.parse import urlparse

from .errors import SendSoonError, create_error

MAX_BODY_LENGTH = 512_000
MAX_SUBJECT_LENGTH = 998
MAX_MARKITDOWN_FILE_BYTES = 10 * 1024 * 1024

SUPPORTED_MARKITDOWN_EXTENSIONS = frozenset(
    {
        ".pdf",
        ".docx",
        ".pptx",
        ".xlsx",
        ".xls",
        ".html",
        ".htm",
        ".txt",
        ".md",
    }
)

_DOMAIN_LABEL_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$")
_IDEMPOTENCY_KEY_RE = re.compile(r"^[A-Za-z0-9._:-]+$")
_BASE64_CHAR_RE = re.compile(r"^[A-Za-z0-9+/]*={0,2}$")


def validate_public_ip(ip: str) -> SendSoonError | None:
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return create_error("INVALID_INPUT", "ip must be a valid IPv4 or IPv6 address.")

    if address.is_global:
        return None

    return create_error(
        "INVALID_INPUT",
        "ip must be public; private, reserved, loopback, link-local, "
        "and multicast addresses are not supported.",
    )


def validate_send_request(request: dict[str, Any]) -> SendSoonError | None:
    email = str(request.get("to", "")).strip()
    at = email.rfind("@")
    local = email[:at] if at > 0 else ""
    domain = email[at + 1 :] if at > 0 else ""
    labels = domain.split(".")
    valid_domain = (
        len(domain) <= 253
        and len(labels) >= 2
        and all(0 < len(label) <= 63 and _DOMAIN_LABEL_RE.match(label) for label in labels)
    )
    if (
        len(email) > 254
        or len(local) > 64
        or not local
        or local.startswith(".")
        or local.endswith(".")
        or ".." in local
        or " " in local
        or "@" in local
        or not valid_domain
    ):
        return create_error("INVALID_RECIPIENT")

    subject = str(request.get("subject", ""))
    if not subject.strip():
        return create_error("INVALID_INPUT", "Subject is required and cannot be empty.")
    if len(subject) > MAX_SUBJECT_LENGTH:
        return create_error(
            "INVALID_INPUT",
            f"Subject must be at most {MAX_SUBJECT_LENGTH} characters.",
        )

    body = str(request.get("body", ""))
    if not body.strip():
        return create_error("INVALID_INPUT", "Body is required and cannot be empty.")
    if len(body.encode("utf-8")) > MAX_BODY_LENGTH:
        return create_error("PAYLOAD_TOO_LARGE")

    if "idempotency_key" in request and request["idempotency_key"] is not None:
        key = str(request["idempotency_key"]).strip()
        if not key or len(key) > 128 or not _IDEMPOTENCY_KEY_RE.match(key):
            return create_error(
                "INVALID_INPUT",
                "idempotency_key must be 1-128 characters using letters, numbers, "
                "dot, underscore, colon, or hyphen.",
            )
    return None


def _normalize_base64(value: str) -> str | None:
    normalized = re.sub(r"\s+", "", value)
    if not normalized or re.search(r"[^A-Za-z0-9+/=]", normalized):
        return None
    if "=" in normalized[:-2]:
        return None
    if len(normalized) % 4 == 1 or not _BASE64_CHAR_RE.match(normalized):
        return None
    try:
        decoded = base64.b64decode(normalized, validate=True)
    except (binascii.Error, ValueError):
        return None
    canonical = base64.b64encode(decoded).decode("ascii").rstrip("=")
    return normalized if canonical == normalized.rstrip("=") else None


def decoded_base64_byte_length(value: str) -> int | None:
    normalized = _normalize_base64(value)
    if normalized is None:
        return None
    return len(base64.b64decode(normalized, validate=True))


MARKITDOWN_EXTENSIONS = tuple(sorted(SUPPORTED_MARKITDOWN_EXTENSIONS))


def validate_markitdown_filename(filename: str) -> SendSoonError | None:
    trimmed = filename.strip()
    if not trimmed:
        return create_error("INVALID_INPUT", "filename is required and cannot be empty.")
    if "/" in trimmed or "\\" in trimmed or "\0" in trimmed:
        return create_error(
            "INVALID_INPUT",
            "filename must be a base name without path separators.",
        )

    dot = trimmed.rfind(".")
    extension = trimmed[dot:].lower() if dot >= 0 else ""
    if extension not in SUPPORTED_MARKITDOWN_EXTENSIONS:
        return create_error(
            "INVALID_INPUT",
            f"Unsupported file extension: {extension or '(none)'}.",
        )
    return None


def validate_markitdown_request(request: dict[str, Any]) -> SendSoonError | None:
    filename_error = validate_markitdown_filename(str(request.get("filename", "")))
    if filename_error:
        return filename_error

    content_base64 = str(request.get("content_base64", ""))
    byte_length = decoded_base64_byte_length(content_base64)
    if byte_length is None:
        return create_error("INVALID_INPUT", "content_base64 must contain valid Base64 data.")
    if byte_length == 0:
        return create_error("INVALID_INPUT", "The file cannot be empty.")
    if byte_length > MAX_MARKITDOWN_FILE_BYTES:
        return create_error("PAYLOAD_TOO_LARGE")
    return None


def validate_base_url(base_url: str) -> SendSoonError | None:
    try:
        parsed = urlparse(base_url)
    except ValueError:
        return create_error("INVALID_CONFIG", "SENDSOON_API_BASE_URL must be a valid URL.")

    if not parsed.scheme or not parsed.netloc:
        return create_error("INVALID_CONFIG", "SENDSOON_API_BASE_URL must be a valid URL.")

    host = parsed.hostname or ""
    local = host in {"localhost", "127.0.0.1", "::1"}
    if parsed.scheme != "https" and not (local and parsed.scheme == "http"):
        return create_error(
            "INVALID_CONFIG",
            "SENDSOON_API_BASE_URL must use HTTPS (HTTP is allowed only for localhost).",
        )
    if parsed.username is not None or parsed.password is not None:
        return create_error(
            "INVALID_CONFIG",
            "SENDSOON_API_BASE_URL must not include credentials.",
        )
    if parsed.query or parsed.fragment:
        return create_error(
            "INVALID_CONFIG",
            "SENDSOON_API_BASE_URL must not include a query string or fragment.",
        )
    return None
