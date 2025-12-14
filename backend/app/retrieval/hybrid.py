"""Hybrid retrieval (Vector + BM25)."""

from typing import List

from app.models.retrieval import ScoredChunk
from app.retrieval.keyword_index import bm25_search
from app.retrieval.normalize import normalize_scores
from app.retrieval.vector_store import vector_search


def hybrid_search(query: str, top_k: int = 5) -> List[ScoredChunk]:
    """Run hybrid retrieval with score fusion."""
    vector_chunks = normalize_scores(vector_search(query, top_k=10))
    bm25_chunks = normalize_scores(bm25_search(query, top_k=10))

    merged: dict[str, ScoredChunk] = {}

    for chunk in vector_chunks + bm25_chunks:
        cid = chunk.chunk.chunk_id
        if cid not in merged:
            merged[cid] = chunk
        else:
            merged[cid].score += chunk.score

    ranked = sorted(
        merged.values(),
        key=lambda x: x.score,
        reverse=True,
    )

    return ranked[:top_k]
