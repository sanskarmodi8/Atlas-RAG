"""Semantic chunking logic without section inference.

This module converts cleaned page-level segments into
overlapping semantic chunks suitable for embedding and retrieval.
"""

import uuid
from typing import List

from app.ingestion.cleaning import clean_text
from app.models.ingestion import Chunk, RawSegment

# Chunk sizing (character-based, model-agnostic)
MAX_CHARS = 1500  # ~300–400 tokens
OVERLAP_CHARS = 200


def chunk_segments(segments: List[RawSegment]) -> List[Chunk]:
    """Convert raw page segments into overlapping semantic chunks.

    Chunking strategy:
    - Sequential accumulation across pages
    - Fixed max character size
    - Sliding overlap for context continuity
    - Page ranges preserved for citation
    """
    if not segments:
        return []

    chunks: List[Chunk] = []

    current_text = ""
    page_start = segments[0].page

    for segment in segments:
        cleaned_text = clean_text(segment.text)

        if not current_text:
            page_start = segment.page

        if len(current_text) + len(cleaned_text) <= MAX_CHARS:
            current_text += " " + cleaned_text
        else:
            chunks.append(
                _create_chunk(
                    doc_id=segment.doc_id,
                    text=current_text,
                    page_start=page_start,
                    page_end=segment.page,
                )
            )

            # Start next chunk with overlap
            current_text = cleaned_text[-OVERLAP_CHARS:]
            page_start = segment.page

    # Flush remaining text
    if current_text:
        chunks.append(
            _create_chunk(
                doc_id=segments[0].doc_id,
                text=current_text,
                page_start=page_start,
                page_end=segments[-1].page,
            )
        )

    return chunks


def _create_chunk(
    *,
    doc_id: str,
    text: str,
    page_start: int,
    page_end: int,
) -> Chunk:
    """Create a Chunk object with metadata."""
    return Chunk(
        chunk_id=str(uuid.uuid4()),
        doc_id=doc_id,
        page_start=page_start,
        page_end=page_end,
        text=text.strip(),
    )
