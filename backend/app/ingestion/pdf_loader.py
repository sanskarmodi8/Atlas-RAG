"""PDF loading and page-level text extraction utilities."""

from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from backend.app.models.ingestion import RawSegment


def extract_pages(file_path: Path, doc_id: str) -> List[RawSegment]:
    """Extract text content from each page of a PDF file.

    Args:
        file_path: Path to the PDF file.
        doc_id: Unique document identifier.

    Returns:
        A list of RawSegment objects, one per PDF page.
    """
    doc = fitz.open(file_path)
    segments: List[RawSegment] = []

    for page_number in range(doc.page_count):
        page = doc.load_page(page_number)
        text = page.get_text("text")
        segments.append(
            RawSegment(
                doc_id=doc_id,
                page=page_number + 1,
                text=text,
            )
        )

    doc.close()
    return segments
