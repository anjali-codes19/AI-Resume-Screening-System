from __future__ import annotations

import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
PROFILE_DIR = BASE_DIR / "seed_assets" / "profiles"
OUTPUT_DIR = BASE_DIR / "seed_assets" / "generated"


def load_json(filename: str) -> list[dict]:
    return json.loads((PROFILE_DIR / filename).read_text())


def resume_text(profile: dict) -> str:
    lines = [
        profile["full_name"],
        profile["headline"],
        profile["location"],
        "",
        "Professional Summary",
        profile["summary"],
        "",
        "Skills",
        ", ".join(profile["skills"]),
        "",
        "Experience",
    ]
    for experience in profile["experience"]:
        lines.append(
            f'{experience["role"]} | {experience["company"]} | {experience["start"]} - {experience["end"]}'
        )
        lines.extend(f"- {highlight}" for highlight in experience["highlights"])
    lines.extend(["", "Projects"])
    for project in profile["projects"]:
        lines.append(f'{project["name"]} ({project["stack"]})')
        lines.append(f'- {project["impact"]}')
    lines.extend(["", "Education"])
    lines.extend(profile["education"])
    return "\n".join(lines)


def job_text(job: dict) -> str:
    lines = [
        job["title"],
        f'Department: {job["department"]}',
        f'Location: {job["location"]}',
        f'Employment Type: {job["employment_type"]}',
        "",
        "Summary",
        job["summary"],
        "",
        "Requirements",
    ]
    lines.extend(f"- {requirement}" for requirement in job["requirements"])
    lines.extend(["", "Responsibilities"])
    lines.extend(f"- {responsibility}" for responsibility in job["responsibilities"])
    return "\n".join(lines)


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def render_pdf(text: str, destination: Path) -> None:
    lines = [line[:96] for line in text.splitlines()]
    pages = chunks(lines, 44) or [[""]]

    objects: dict[int, str] = {
        1: "<< /Type /Catalog /Pages 2 0 R >>",
        3: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    }

    kids: list[str] = []
    object_number = 4
    for page_lines in pages:
        page_id = object_number
        content_id = object_number + 1
        kids.append(f"{page_id} 0 R")
        stream_lines = ["BT", "/F1 11 Tf", "50 770 Td", "14 TL"]
        for index, line in enumerate(page_lines):
            escaped = escape_pdf_text(line)
            if index == 0:
                stream_lines.append(f"({escaped}) Tj")
            else:
                stream_lines.append(f"T* ({escaped}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines)
        objects[page_id] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>"
        )
        objects[content_id] = f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}\nendstream"
        object_number += 2

    objects[2] = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(kids)} >>"

    output = ["%PDF-1.4\n"]
    offsets = {0: "0000000000 65535 f "}
    for object_id in range(1, max(objects) + 1):
        offsets[object_id] = f"{sum(len(part.encode('latin-1')) for part in output):010d} 00000 n "
        output.append(f"{object_id} 0 obj\n{objects[object_id]}\nendobj\n")

    xref_offset = sum(len(part.encode("latin-1")) for part in output)
    output.append(f"xref\n0 {max(objects) + 1}\n")
    for object_id in range(0, max(objects) + 1):
        output.append(f"{offsets[object_id]}\n")
    output.append(
        f"trailer\n<< /Size {max(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    )

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes("".join(output).encode("latin-1"))


def slugify(value: str) -> str:
    return value.lower().replace(" ", "-")


def main() -> None:
    profiles = load_json("sample_profiles.json")
    jobs = load_json("sample_jobs.json")

    for profile in profiles:
        render_pdf(
            resume_text(profile),
            OUTPUT_DIR / "resumes" / f"{slugify(profile['full_name'])}.pdf",
        )
    for job in jobs:
        render_pdf(job_text(job), OUTPUT_DIR / "jobs" / f"{slugify(job['title'])}.pdf")

    print(f"Generated sample PDFs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
