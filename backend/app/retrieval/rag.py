"""Basic vector-only RAG retrieval."""

from typing import List

from app.retrieval.vector_store import search_vector


def retrieve_context(query: str, top_k: int = 5) -> List[dict]:
    """Retrieve top-K chunks from vector store."""
    results = search_vector(query, top_k=top_k)

    contexts = []
    for r in results:
        payload = r.payload
        contexts.append(
            {
                "text": payload["text"],
                "page_start": payload["page_start"],
                "page_end": payload["page_end"],
                "score": r.score,
            }
        )

    return contexts
