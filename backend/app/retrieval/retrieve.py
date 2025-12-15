"""Unified Hybrid + Graph retrieval.

Pipeline:
Vector → BM25 → merge → graph recall → rank
"""

from typing import Dict, List

from app.ingestion.entities import NLP
from app.models.retrieval import ScoredChunk
from app.retrieval.chunk_registry import get_chunks
from app.retrieval.graph_utils import (
    build_graph,
    chunks_from_entities,
    expand_entities,
    extract_query_entities,
)
from app.retrieval.keyword_index import bm25_search
from app.retrieval.vector_store import vector_search


def hybrid_graph_search(query: str, top_k: int) -> List[ScoredChunk]:
    """Hybrid + Graph-RAG retrieval.

    Important:
    - top_k controls FINAL context size
    - retrieval breadth is independent
    """
    # 1. Broad seed retrieval
    seed_k = max(top_k * 4, 8)

    vector_results = vector_search(query, top_k=seed_k)
    bm25_results = bm25_search(query, top_k=seed_k)

    combined: Dict[str, ScoredChunk] = {sc.chunk.chunk_id: sc for sc in vector_results}

    for sc in bm25_results:
        combined.setdefault(sc.chunk.chunk_id, sc)

    # 2. Graph recall expansion
    all_chunks = get_chunks()
    graph = build_graph(all_chunks)

    query_entities = extract_query_entities(query, NLP)

    if query_entities:
        expanded_entities = expand_entities(graph, query_entities, hops=1)
        graph_chunks = chunks_from_entities(all_chunks, expanded_entities)

        for chunk in graph_chunks:
            if chunk.chunk_id not in combined:
                combined[chunk.chunk_id] = ScoredChunk(
                    chunk=chunk,
                    score=0.25,  # low but non-zero recall score
                )

    # 3. Rank and return
    results = list(combined.values())
    results.sort(key=lambda x: x.score, reverse=True)

    return results[:top_k]
