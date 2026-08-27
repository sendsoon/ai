"""Load local files for markitdown_convert."""

from __future__ import annotations

import base64
from pathlib import Path

from .errors import SendSoonError, create_error
from .validation import MAX_MARKITDOWN_FILE_BYTES, validate_markitdown_filename


def load_markitdown_file_from_path(
    file_path: str,
) -> tuple[dict[str, str] | None, SendSoonError | None]:
    trimmed = file_path.strip()
    if not trimmed:
        return None, create_error("INVALID_INPUT", "file_path is required and cannot be empty.")

    try:
        resolved = Path(trimmed).expanduser().resolve(strict=False)
    except (OSError, ValueError):
        return None, create_error("INVALID_INPUT", "file_path must be a valid local file path.")

    if not resolved.exists():
        return None, create_error("INVALID_INPUT", "file_path does not exist or is not readable.")
    if not resolved.is_file():
        return None, create_error("INVALID_INPUT", "file_path must point to a file.")

    byte_length = resolved.stat().st_size
    if byte_length == 0:
        return None, create_error("INVALID_INPUT", "The file cannot be empty.")
    if byte_length > MAX_MARKITDOWN_FILE_BYTES:
        return None, create_error("PAYLOAD_TOO_LARGE")

    filename = resolved.name
    filename_error = validate_markitdown_filename(filename)
    if filename_error:
        return None, filename_error

    content = resolved.read_bytes()
    return {
        "filename": filename,
        "content_base64": base64.b64encode(content).decode("ascii"),
    }, None
