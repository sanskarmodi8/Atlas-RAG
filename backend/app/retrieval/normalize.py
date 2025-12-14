"""Score normalization utilities."""

from typing import List

from app.models.retrieval import ScoredChunk


def normalize_scores(chunks: List[ScoredChunk]) -> List[ScoredChunk]:
    """Min-max normalize scores to [0, 1]."""
    if not chunks:
        return []

    scores = [c.score for c in chunks]
    min_score = min(scores)
    max_score = max(scores)

    if min_score == max_score:
        for c in chunks:
            c.score = 1.0
        return chunks

    for c in chunks:
        c.score = (c.score - min_score) / (max_score - min_score)

    return chunks
