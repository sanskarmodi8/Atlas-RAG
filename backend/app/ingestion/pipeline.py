"""High-level document ingestion pipeline.

This module orchestrates the full ingestion flow:
PDF -> raw pages -> cleaned text -> semantic chunks.
"""

from pathlib import Path
from typing import List

from app.ingestion.chunking import chunk_segments
from app.ingestion.cleaning import clean_text
from app.ingestion.pdf_loader import extract_pages
from app.models.ingestion import Chunk, RawSegment


def ingest_pdf(file_path: Path, doc_id: str) -> List[Chunk]:
    """Ingest a PDF document into semantic chunks.

    Args:
        file_path: Path to the PDF file.
        doc_id: Unique identifier for the document.

    Returns:
        A list of Chunk objects ready for indexing.
    """
    # 1. Extract raw page-level text
    raw_segments = extract_pages(file_path=file_path, doc_id=doc_id)

    # 2. Clean page text (in-place, but explicit)
    cleaned_segments = _clean_segments(raw_segments)

    # 3. Convert cleaned pages into semantic chunks
    chunks = chunk_segments(cleaned_segments)

    return chunks


def _clean_segments(segments: List[RawSegment]) -> List[RawSegment]:
    """Apply text cleaning to raw segments."""
    cleaned: List[RawSegment] = []

    for segment in segments:
        cleaned.append(
            RawSegment(
                doc_id=segment.doc_id,
                page=segment.page,
                text=clean_text(segment.text),
            )
        )

    return cleaned
