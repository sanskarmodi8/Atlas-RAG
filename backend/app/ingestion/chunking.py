"""Chunking logic."""

import uuid
from typing import List

from app.models.ingestion import Chunk, RawSegment

MAX_CHARS = 1500
OVERLAP_CHARS = 200


def chunk_segments(segments: List[RawSegment]) -> List[Chunk]:
    """Convert RawSegments into size-bounded chunks."""
    chunks: List[Chunk] = []

    for seg in segments:
        text = seg.text.strip()
        start = 0

        while start < len(text):
            end = start + MAX_CHARS
            chunk_text = text[start:end]

            chunks.append(
                Chunk(
                    chunk_id=str(uuid.uuid4()),
                    doc_id=seg.doc_id,
                    page_start=seg.page,
                    page_end=seg.page,
                    text=chunk_text.strip(),
                )
            )

            # move forward with overlap
            start = end - OVERLAP_CHARS

    return chunks
