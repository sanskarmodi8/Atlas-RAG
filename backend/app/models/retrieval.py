"""Pydantic models for API request and response bodies."""

from app.models.ingestion import Chunk
from pydantic import BaseModel


class KeywordSearchRequest(BaseModel):
    """Schema for BM25 search request body."""

    query: str
    top_k: int = 5


class ScoredChunk(BaseModel):
    """Schema for a scored chunk."""

    chunk: Chunk
    score: float
