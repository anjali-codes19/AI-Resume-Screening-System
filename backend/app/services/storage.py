from __future__ import annotations

import re
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.base_dir = get_settings().uploads_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_bytes(self, payload: bytes, filename: str, namespace: str) -> Path:
        suffix = Path(filename).suffix or ".bin"
        safe_stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(filename).stem).strip("-")
        dated_folder = datetime.now(UTC).strftime("%Y/%m/%d")
        destination_dir = self.base_dir / namespace / dated_folder
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / f"{safe_stem or 'document'}-{uuid4().hex}{suffix}"
        destination.write_bytes(payload)
        return destination
