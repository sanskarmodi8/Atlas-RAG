"""Vector-based retrieval using Qdrant."""

from typing import List

from app.core.embeddings import embed_texts
from app.ingestion.indexing import COLLECTION_NAME, get_qdrant_client
from qdrant_client.models import ScoredPoint


def search_vector(query: str, top_k: int = 5) -> List[ScoredPoint]:
    """Search for semantically similar chunks.

    Args:
        query: User query text.
        top_k: Number of results to return.

    Returns:
        List of scored Qdrant points.
    """
    client = get_qdrant_client()

    query_vector = embed_texts([query])[0]

    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k,
    )
