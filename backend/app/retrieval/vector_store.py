"""Vector-based retrieval using Qdrant."""

from typing import List

from app.core.embeddings import embed_texts
from app.ingestion.indexing import COLLECTION_NAME, get_qdrant_client
from app.models.ingestion import Chunk
from app.models.retrieval import ScoredChunk
from qdrant_client.models import ScoredPoint


def vector_search(query: str, top_k: int = 5) -> List[ScoredChunk]:
    """Search for semantically similar chunks."""
    client = get_qdrant_client()

    query_vector = embed_texts([query])[0]

    results: List[ScoredPoint] = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k,
    )

    scored_chunks: List[ScoredChunk] = []

    for point in results:
        payload = point.payload

        chunk = Chunk(
            chunk_id=str(point.id),
            doc_id=payload["doc_id"],
            page_start=payload["page_start"],
            page_end=payload["page_end"],
            text=payload["text"],
            entities=payload.get("entities", []),
        )

        scored_chunks.append(ScoredChunk(chunk=chunk, score=float(point.score)))

    return scored_chunks
