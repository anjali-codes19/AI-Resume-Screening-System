from __future__ import annotations

import io
from pathlib import Path

from pypdf import PdfReader


class DocumentParser:
    def extract_text_from_bytes(self, data: bytes, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        if suffix == ".pdf":
            try:
                reader = PdfReader(io.BytesIO(data))
                text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
                if text:
                    return text
            except Exception:
                pass
        return data.decode("utf-8", errors="ignore").strip()

    def extract_text_from_file(self, path: str | Path) -> str:
        file_path = Path(path)
        return self.extract_text_from_bytes(file_path.read_bytes(), file_path.name)
