"""Evaluation-only retrievers."""

from typing import List

from backend.app.models.retrieval import ScoredChunk
from backend.app.retrieval.vector_store import vector_search


def vector_only_search(query: str, top_k: int) -> List[ScoredChunk]:
    """Pure vector search baseline."""
    return vector_search(query, top_k=top_k)
