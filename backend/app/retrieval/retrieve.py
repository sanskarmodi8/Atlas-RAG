"""Unified Hybrid + Adaptive Graph-RAG retrieval."""

from typing import Dict, List, Set

from backend.app.ingestion.entities import NLP
from backend.app.models.retrieval import ScoredChunk
from backend.app.retrieval.chunk_registry import get_chunks
from backend.app.retrieval.graph_utils import (
    adaptive_hops,
    build_graph,
    chunks_from_entities,
    expand_entities,
    extract_query_entities,
)
from backend.app.retrieval.keyword_index import bm25_search
from backend.app.retrieval.reranker import CrossEncoderReranker
from backend.app.retrieval.vector_store import vector_search

# Keywords that indicate comparison-style queries
_COMPARISON_KEYWORDS = {
    "difference",
    "different",
    "compare",
    "comparison",
    "vs",
    "versus",
}

# Initialize reranker once
_reranker = CrossEncoderReranker()


def _fallback_query_terms(query: str) -> Set[str]:
    """Fallback entity-like terms when NER fails."""
    return {token.lower() for token in query.split() if len(token) >= 4}


def hybrid_graph_search(query: str, top_k: int) -> List[ScoredChunk]:
    """Hybrid + Adaptive Graph-RAG retrieval.

    Design principles:
    - Recall is BROAD and independent of top_k
    - Graph-RAG activates for abstract & comparison queries
    - Cross-encoder reranker provides final precision
    - top_k controls ONLY final context size
    """
    # 1. Broad seed retrieval (recall-focused)
    seed_k = max(top_k * 4, 8)

    vector_hits = vector_search(query, top_k=seed_k)
    bm25_hits = bm25_search(query, top_k=seed_k)

    combined: Dict[str, ScoredChunk] = {sc.chunk.chunk_id: sc for sc in vector_hits}

    for sc in bm25_hits:
        combined.setdefault(sc.chunk.chunk_id, sc)

    # 2. Graph-based recall expansion
    all_chunks = get_chunks()
    graph = build_graph(all_chunks)

    query_entities = extract_query_entities(query, NLP)

    # Fallback when NER finds nothing
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
                        # Recall-only score (NOT ranking score)
                        score=0.20 + (0.05 * len(chunk.entities)),
                    )
                )

    # 3. Merge recall pools
    candidates = list(combined.values()) + graph_recalled

    if not candidates:
        return []

    # 4. Cross-encoder reranking (precision step)
    reranked = _reranker.rerank(
        query=query,
        candidates=candidates,
        top_k=max(top_k, 2),
    )

    # 5. Comparison-safe final selection
    is_comparison = any(keyword in query.lower() for keyword in _COMPARISON_KEYWORDS)

    if is_comparison:
        # Ensure multiple viewpoints survive
        seen = set()
        final: List[ScoredChunk] = []

        for sc in reranked:
            if sc.chunk.chunk_id not in seen:
                final.append(sc)
                seen.add(sc.chunk.chunk_id)

            if len(final) >= max(top_k, 2):
                break

        return final

    # 6. Normal final truncate
    return reranked[:top_k]
