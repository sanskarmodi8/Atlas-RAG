"""In-memory chunk registry.

Single source of truth for all ingested chunks.
Used by graph-based retrieval to map entities back to chunks.

Note:
- Ephemeral by design (non-persistent)
- Rebuilt on each ingestion cycle
"""

from typing import Dict, List

from app.models.ingestion import Chunk

_CHUNKS: Dict[str, Chunk] = {}


def register_chunks(chunks: List[Chunk]) -> None:
    """Register chunks in memory."""
    for chunk in chunks:
        _CHUNKS[chunk.chunk_id] = chunk


def get_chunks() -> List[Chunk]:
    """Return all registered chunks."""
    return list(_CHUNKS.values())


def clear_chunks() -> None:
    """Clear registry (useful for tests)."""
    _CHUNKS.clear()
