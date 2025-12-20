"""Cross-Encoder reranker module."""

from typing import List

from app.models.retrieval import ScoredChunk
from sentence_transformers import CrossEncoder


class CrossEncoderReranker:
    """Cross-encoder reranker for precise relevance scoring.

    Uses a CPU-friendly MS MARCO cross-encoder.
    """

    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
    ) -> None:
        """Initialize encoder model."""
        self.model = CrossEncoder(model_name)

    def rerank(
        self,
        query: str,
        candidates: List[ScoredChunk],
        top_k: int,
    ) -> List[ScoredChunk]:
        """Rerank candidate chunks using cross-encoder relevance scores."""
        if not candidates:
            return []

        pairs = [(query, sc.chunk.text) for sc in candidates]

        scores = self.model.predict(pairs)

        for sc, score in zip(candidates, scores):
            sc.score = float(score)

        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_k]
