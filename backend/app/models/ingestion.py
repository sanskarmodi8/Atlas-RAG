"""Pydantic models for ingestion artifacts."""

from typing import List

from pydantic import BaseModel, Field


class RawSegment(BaseModel):
    """Represents raw page-level text extracted from a document."""

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
    entities: List[str] = Field(default_factory=list)
