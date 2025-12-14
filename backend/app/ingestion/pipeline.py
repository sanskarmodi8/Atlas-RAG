"""High-level document ingestion pipeline."""

from pathlib import Path
from typing import List

from app.ingestion.chunking import chunk_segments
from app.ingestion.cleaning import clean_text
from app.ingestion.indexing import index_chunks
from app.ingestion.pdf_loader import extract_pages
from app.models.ingestion import Chunk, RawSegment
from app.retrieval.keyword_index import build_bm25_index


def ingest_pdf(file_path: Path, doc_id: str) -> List[Chunk]:
    """Ingest a PDF document into indexed chunks."""
    raw_segments = extract_pages(file_path=file_path, doc_id=doc_id)
    cleaned_segments = _clean_segments(raw_segments)
    chunks = chunk_segments(cleaned_segments)

    index_chunks(chunks)
    build_bm25_index(chunks)

    return chunks


def _clean_segments(segments: List[RawSegment]) -> List[RawSegment]:
    """Apply text cleaning to raw segments."""
    return [
        RawSegment(
            doc_id=s.doc_id,
            page=s.page,
            text=clean_text(s.text),
        )
        for s in segments
    ]
