"""Graph utilities for Graph-RAG.

Responsibilities:
- Build entity co-occurrence graph
- Index entity → chunk mappings
- Extract entities from queries
- Expand entities via graph traversal
- Recall chunks via entity relationships
"""

from collections import defaultdict
from typing import Dict, Iterable, List, Set

import networkx as nx
from app.models.ingestion import Chunk

# In-memory entity → chunk index
_ENTITY_TO_CHUNKS: Dict[str, Set[str]] = defaultdict(set)


def index_entities(chunks: List[Chunk]) -> None:
    """Index entities to chunk IDs.

    Called once during ingestion.
    """
    for chunk in chunks:
        for entity in chunk.entities:
            _ENTITY_TO_CHUNKS[entity].add(chunk.chunk_id)


def build_graph(chunks: List[Chunk]) -> nx.Graph:
    """Build an entity co-occurrence graph.

    Nodes: entities
    Edges: co-occurrence within the same chunk
    """
    graph = nx.Graph()

    for chunk in chunks:
        entities = chunk.entities

        for entity in entities:
            graph.add_node(entity)

        for i, e1 in enumerate(entities):
            for e2 in entities[i + 1 :]:
                if graph.has_edge(e1, e2):
                    graph[e1][e2]["weight"] += 1
                else:
                    graph.add_edge(e1, e2, weight=1)

    return graph


def extract_query_entities(text: str, nlp) -> Set[str]:
    """Extract entities from a user query.

    Deterministic (spaCy-based).
    """
    if not text.strip():
        return set()

    doc = nlp(text)
    return {ent.text.strip() for ent in doc.ents if len(ent.text.strip()) >= 3}


def expand_entities(
    graph: nx.Graph,
    entities: Iterable[str],
    hops: int = 1,
) -> Set[str]:
    """Expand entities via graph traversal.

    hops=1 → direct neighbors
    hops=2 → neighbors of neighbors
    """
    expanded: Set[str] = set(entities)

    for _ in range(hops):
        neighbors: Set[str] = set()
        for entity in expanded:
            if entity in graph:
                neighbors.update(graph.neighbors(entity))
        expanded |= neighbors

    return expanded


def chunks_from_entities(
    chunks: List[Chunk],
    entities: Set[str],
) -> List[Chunk]:
    """Recall chunks mentioning any of the given entities.

    THIS is the Graph-RAG recall step.
    """
    matched_chunk_ids: Set[str] = set()

    for entity in entities:
        matched_chunk_ids |= _ENTITY_TO_CHUNKS.get(entity, set())

    return [chunk for chunk in chunks if chunk.chunk_id in matched_chunk_ids]
