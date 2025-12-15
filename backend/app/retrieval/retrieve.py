"""Unified Hybrid + Adaptive Graph-RAG retrieval."""

from typing import Dict, List, Set

from app.ingestion.entities import NLP
from app.models.retrieval import ScoredChunk
from app.retrieval.chunk_registry import get_chunks
from app.retrieval.graph_utils import (
    adaptive_hops,
    build_graph,
    chunks_from_entities,
    expand_entities,
    extract_query_entities,
)
from app.retrieval.keyword_index import bm25_search
from app.retrieval.vector_store import vector_search

_COMPARISON_KEYWORDS = {
    "difference",
    "different",
    "compare",
    "comparison",
    "vs",
    "versus",
}


def _fallback_query_terms(query: str) -> Set[str]:
    """Fallback entity-like terms when NER fails."""
    return {token.lower() for token in query.split() if len(token) >= 4}


def hybrid_graph_search(query: str, top_k: int) -> List[ScoredChunk]:
    """Hybrid + Adaptive Graph-RAG retrieval.

    Design principles:
    - Recall is BROAD and independent of top_k
    - Graph-RAG MUST activate for abstract & comparison queries
    - top_k controls ONLY final context size
    """
    # 1. Broad seed retrieval
    seed_k = max(top_k * 4, 8)

    vector_hits = vector_search(query, top_k=seed_k)
    bm25_hits = bm25_search(query, top_k=seed_k)

    combined: Dict[str, ScoredChunk] = {sc.chunk.chunk_id: sc for sc in vector_hits}

    for sc in bm25_hits:
        combined.setdefault(sc.chunk.chunk_id, sc)

    # 2. Graph recall
    all_chunks = get_chunks()
    graph = build_graph(all_chunks)

    query_entities = extract_query_entities(query, NLP)

    # Fallback when NER finds nothing (VERY IMPORTANT)
    if not query_entities:
        query_entities = _fallback_query_terms(query)

    hops = adaptive_hops(len(query_entities))

    graph_recalled: List[ScoredChunk] = []

    if hops > 0 and query_entities:
        expanded_entities = expand_entities(graph, query_entities, hops)
        graph_chunks = chunks_from_entities(all_chunks, expanded_entities)

        for chunk in graph_chunks:
            if chunk.chunk_id not in combined:
                graph_recalled.append(
                    ScoredChunk(
                        chunk=chunk,
                        # Recall score — NOT ranking score
                        score=0.20 + (0.05 * len(chunk.entities)),
                    )
                )

    # 3. Merge recall pools
    candidates = list(combined.values()) + graph_recalled

    # 4. Rank (heuristic, reranker-ready)
    candidates.sort(key=lambda x: x.score, reverse=True)

    # 5. Comparison-safe truncation
    is_comparison = any(keyword in query.lower() for keyword in _COMPARISON_KEYWORDS)

    if is_comparison:
        # Ensure BOTH sides of comparison survive
        seen_chunks = set()
        final: List[ScoredChunk] = []

        for sc in candidates:
            if sc.chunk.chunk_id not in seen_chunks:
                final.append(sc)
                seen_chunks.add(sc.chunk.chunk_id)

            if len(final) >= max(top_k, 2):
                break

        return final

    # 6. Final truncate (non-comparison)
    return candidates[:top_k]
