"""Layout-aware PDF loading utilities.

Extracts semantic text blocks while:
- preserving headings
- removing known headers/footers
- avoiding image blocks
"""

import re
from pathlib import Path
from typing import List

import fitz  # PyMuPDF
from app.models.ingestion import RawSegment

HEADER_FOOTER_PATTERNS: list[str] = [
    r"Operations@learnnex\.in",
    r"www\.LearnNex\.in",
]

HEADING_REGEX = re.compile(r"^\d+\.\s+[A-Z].+")


def _is_header_footer(text: str) -> bool:
    """Check whether a line matches known header/footer patterns."""
    return any(re.search(pattern, text) for pattern in HEADER_FOOTER_PATTERNS)


def extract_pages(file_path: Path, doc_id: str) -> List[RawSegment]:
    """Extract semantic text blocks from a PDF.

    This loader is layout-aware and heading-preserving.
    It emits logical text segments instead of raw page dumps.

    Args:
        file_path: Path to the PDF file.
        doc_id: Unique document identifier.

    Returns:
        List of RawSegment objects.
    """
    doc = fitz.open(file_path)
    segments: List[RawSegment] = []

    for page_index, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        current_block: list[str] = []
        page_number = page_index + 1

        for block in blocks:
            # Skip non-text blocks (images, drawings, etc.)
            if block["type"] != 0:
                continue

            for line in block["lines"]:
                line_text = " ".join(span["text"] for span in line["spans"]).strip()

                if not line_text:
                    continue

                if _is_header_footer(line_text):
                    continue

                # New heading → flush previous block
                if HEADING_REGEX.match(line_text) and current_block:
                    segments.append(
                        RawSegment(
                            doc_id=doc_id,
                            page=page_number,
                            text="\n".join(current_block),
                        )
                    )
                    current_block = []

                current_block.append(line_text)

        if current_block:
            segments.append(
                RawSegment(
                    doc_id=doc_id,
                    page=page_number,
                    text="\n".join(current_block),
                )
            )

    doc.close()
    return segments
