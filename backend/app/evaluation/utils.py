"""Utility helpers for evaluation."""

from typing import Iterable

from backend.app.models.retrieval import ScoredChunk


def extract_pages(results: Iterable[ScoredChunk]) -> list[int]:
    """Extract page numbers from retrieved chunks."""
    return [sc.chunk.page_start for sc in results]
