"""Embedding model abstraction."""

from typing import List

from sentence_transformers import SentenceTransformer

# Load once at startup
_EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Convert text strings into normalized embedding vectors.

    Args:
        texts: List of input strings.

    Returns:
        List of embedding vectors.
    """
    return _EMBEDDING_MODEL.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    ).tolist()
