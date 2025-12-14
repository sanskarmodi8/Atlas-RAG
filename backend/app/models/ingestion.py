"""Pydantic models for Ingestion artifacts."""

from pydantic import BaseModel


class RawSegment(BaseModel):
    """Represents raw page-level text extracted from a PDF."""

    doc_id: str
    page: int
    text: str


class Chunk(BaseModel):
    """Represents a semantically meaningful chunk of a document."""

    chunk_id: str
    doc_id: str
    page_start: int
    page_end: int
    text: str
