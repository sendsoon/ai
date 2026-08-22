"""Environment configuration for SendSoon API access."""

from __future__ import annotations

import os
from dataclasses import dataclass

DEFAULT_BASE_URL = "https://www.sendsoonai.com"


@dataclass(frozen=True, slots=True)
class Settings:
    api_key: str | None
    base_url: str
    email_recipient: str | None

    @classmethod
    def from_env(cls) -> Settings:
        api_key = os.environ.get("SENDSOON_API_KEY", "").strip() or None
        base_url = os.environ.get("SENDSOON_API_BASE_URL", "").strip() or DEFAULT_BASE_URL
        email_recipient = os.environ.get("SENDSOON_EMAIL_RECIPIENT", "").strip() or None
        return cls(api_key=api_key, base_url=base_url, email_recipient=email_recipient)
