"""Pydantic models for API request and response bodies."""

from pydantic import BaseModel

from backend.app.models.ingestion import Chunk


class KeywordSearchRequest(BaseModel):
    """Schema for BM25 search request body."""

    query: str
    top_k: int = 5


class ScoredChunk(BaseModel):
    """Schema for a scored chunk."""

    chunk: Chunk
    score: float
