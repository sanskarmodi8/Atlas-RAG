"""Graph utilities for adaptive Graph-RAG."""

from collections import defaultdict
from typing import Dict, Iterable, List, Set

import networkx as nx
from app.models.ingestion import Chunk

_ENTITY_TO_CHUNKS: Dict[str, Set[str]] = defaultdict(set)


def index_entities(chunks: List[Chunk]) -> None:
    """Index concepts to chunk IDs."""
    for chunk in chunks:
        for concept in chunk.entities:
            _ENTITY_TO_CHUNKS[concept].add(chunk.chunk_id)


def build_graph(chunks: List[Chunk]) -> nx.Graph:
    """Build a concept co-occurrence graph."""
    graph = nx.Graph()

    for chunk in chunks:
        concepts = chunk.entities

        for concept in concepts:
            graph.add_node(concept)

        for i, c1 in enumerate(concepts):
            for c2 in concepts[i + 1 :]:
                current_weight = graph.get_edge_data(c1, c2, {}).get("weight", 0)
                graph.add_edge(
                    c1,
                    c2,
                    weight=current_weight + 1,
                )

    return graph


def extract_query_entities(text: str, nlp) -> Set[str]:
    """Extract high-signal concepts from a user query."""
    doc = nlp(text)

    concepts: Set[str] = set()

    # 1. Named entities (high precision)
    for ent in doc.ents:
        if ent.label_ in {"ORG", "PRODUCT", "WORK_OF_ART"}:
            concepts.add(ent.text.lower())

    # 2. Noun-based keywords (controlled recall)
    for token in doc:
        if token.pos_ in {"NOUN", "PROPN"}:
            if not token.is_stop and len(token.text) >= 4:
                concepts.add(token.lemma_.lower())

    return concepts


def adaptive_hops(num_entities: int) -> int:
    """Decide graph expansion depth."""
    if num_entities <= 1:
        return 0
    if num_entities <= 3:
        return 1
    return 2


def expand_entities(
    graph: nx.Graph,
    entities: Iterable[str],
    hops: int,
) -> Set[str]:
    """Expand entities via graph traversal."""
    expanded = set(entities)

    for _ in range(hops):
        neighbors = set()
        for entity in expanded:
            if entity in graph:
                neighbors.update(graph.neighbors(entity))
        expanded |= neighbors

    return expanded


def chunks_from_entities(
    chunks: List[Chunk],
    entities: Set[str],
) -> List[Chunk]:
    """Recall chunks mentioning expanded entities."""
    matched_ids: Set[str] = set()

    for entity in entities:
        matched_ids |= _ENTITY_TO_CHUNKS.get(entity, set())

    return [chunk for chunk in chunks if chunk.chunk_id in matched_ids]
