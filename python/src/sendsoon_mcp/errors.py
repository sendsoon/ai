"""Error codes and HTTP/network error mapping (aligned with @sendsoon/core)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Final, Literal

ErrorCode = Literal[
    "INVALID_INPUT",
    "INVALID_RECIPIENT",
    "INVALID_RESPONSE",
    "INVALID_CONFIG",
    "AUTH_ERROR",
    "PAYLOAD_TOO_LARGE",
    "RATE_LIMITED",
    "SERVER_ERROR",
    "NETWORK_ERROR",
    "TIMEOUT",
]

ERROR_MESSAGES: Final[dict[ErrorCode, str]] = {
    "INVALID_INPUT": (
        "Invalid input. Check required fields (to, subject, body) and try again."
    ),
    "INVALID_RECIPIENT": (
        "Recipient email address is invalid. Provide a valid address such as name@example.com."
    ),
    "INVALID_RESPONSE": "SendSoon API returned an invalid response. Try again later.",
    "INVALID_CONFIG": "SendSoon configuration is invalid. Check SENDSOON_API_BASE_URL.",
    "AUTH_ERROR": (
        "Authentication failed. Check the credentials required by the "
        "configured SendSoon deployment."
    ),
    "PAYLOAD_TOO_LARGE": "Email body is too large. Reduce the content size and try again.",
    "RATE_LIMITED": "SendSoon API rate limit reached. Wait a moment and try again.",
    "SERVER_ERROR": "SendSoon service is temporarily unavailable. Try again later.",
    "NETWORK_ERROR": (
        "Network error while contacting SendSoon API. Check connectivity and try again."
    ),
    "TIMEOUT": "SendSoon API request timed out. Try again later.",
}

RETRYABLE_CODES: Final[frozenset[ErrorCode]] = frozenset(
    {
        "RATE_LIMITED",
        "SERVER_ERROR",
        "NETWORK_ERROR",
        "TIMEOUT",
        "INVALID_RESPONSE",
    }
)


@dataclass(frozen=True, slots=True)
class SendSoonError:
    code: ErrorCode
    message: str
    retryable: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "retryable": self.retryable,
        }


def create_error(code: ErrorCode, message: str | None = None) -> SendSoonError:
    return SendSoonError(
        code=code,
        message=message or ERROR_MESSAGES[code],
        retryable=code in RETRYABLE_CODES,
    )


def sanitize_api_message(raw: str) -> str | None:
    trimmed = raw.strip()
    if not trimmed:
        return None

    lower = trimmed.lower()
    if (
        "stack" in lower
        or "traceback" in lower
        or " at " in trimmed
        or "sql" in trimmed.lower()
    ):
        return None

    if len(trimmed) > 240:
        return f"{trimmed[:237]}..."
    return trimmed


def parse_api_error_message(body: str) -> str | None:
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return sanitize_api_message(body)

    if not isinstance(parsed, dict):
        return sanitize_api_message(body)

    message = parsed.get("message")
    if isinstance(message, str):
        return sanitize_api_message(message)

    error = parsed.get("error")
    if isinstance(error, str):
        return sanitize_api_message(error)
    if isinstance(error, dict):
        nested = error.get("message")
        if isinstance(nested, str):
            return sanitize_api_message(nested)

    detail = parsed.get("detail")
    if isinstance(detail, str):
        return sanitize_api_message(detail)

    return None


def map_http_error(status: int, body: str) -> SendSoonError:
    api_message = parse_api_error_message(body)

    if status == 400:
        return create_error("INVALID_INPUT", api_message)
    if status in {401, 403}:
        return create_error("AUTH_ERROR", api_message)
    if status == 413:
        return create_error("PAYLOAD_TOO_LARGE", api_message)
    if status == 429:
        return create_error("RATE_LIMITED", api_message)
    if status >= 500:
        return create_error("SERVER_ERROR", api_message)

    return create_error("INVALID_INPUT", api_message or ERROR_MESSAGES["INVALID_INPUT"])


def map_network_error(error: BaseException | None = None) -> SendSoonError:
    timeout_names = {
        "TimeoutException",
        "ReadTimeout",
        "ConnectTimeout",
        "WriteTimeout",
        "PoolTimeout",
    }
    if error is not None and type(error).__name__ in timeout_names:
        return create_error("TIMEOUT")
    return create_error("NETWORK_ERROR")
