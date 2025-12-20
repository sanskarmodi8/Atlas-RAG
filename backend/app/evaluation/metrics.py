"""Evaluation metrics for retrieval quality."""

from typing import Iterable, Set


def recall_at_k(retrieved_pages: Iterable[int], expected_pages: Set[int]) -> float:
    """Compute Recall@K."""
    return float(bool(set(retrieved_pages) & expected_pages))


def coverage(retrieved_pages: Iterable[int]) -> int:
    """Number of unique pages retrieved."""
    return len(set(retrieved_pages))


def diversity(retrieved_pages: Iterable[int]) -> float:
    """Ratio of unique pages to total retrieved pages."""
    pages = list(retrieved_pages)
    if not pages:
        return 0.0
    return len(set(pages)) / len(pages)
