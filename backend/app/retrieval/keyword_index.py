"""BM25 keyword-based retrieval."""

from typing import List

from app.models.ingestion import Chunk
from app.models.retrieval import ScoredChunk
from rank_bm25 import BM25Okapi

_bm25: BM25Okapi | None = None
_chunks: List[Chunk] = []


def build_bm25_index(chunks: List[Chunk]) -> None:
    """Build an in-memory BM25 index."""
    global _bm25, _chunks

    _chunks = chunks
    corpus = [chunk.text.lower().split() for chunk in chunks]

    _bm25 = BM25Okapi(corpus)


def bm25_search(query: str, top_k: int = 10) -> List[ScoredChunk]:
    """Run BM25 keyword search."""
    if _bm25 is None:
        return []

    tokens = query.lower().split()
    scores = _bm25.get_scores(tokens)

    scored = [
        ScoredChunk(chunk=_chunks[i], score=float(score))
        for i, score in enumerate(scores)
        if score > 0
    ]

    scored.sort(key=lambda x: x.score, reverse=True)
    return scored[:top_k]
