"""Citation filtering utilities.

Selects only the sentences from retrieved chunks that
directly support the generated answer.
"""

import re
from typing import List

from sentence_transformers import SentenceTransformer, util

from backend.app.models.api import Citation
from backend.app.models.retrieval import ScoredChunk

# Lightweight sentence embedder
_SENTENCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# Conservative threshold: avoids noise
_SIMILARITY_THRESHOLD = 0.45
_MAX_SENTENCES_PER_CHUNK = 2


def _split_sentences(text: str) -> List[str]:
    """Split text into clean sentences."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) >= 20]


def filter_citations(
    answer: str,
    chunks: List[ScoredChunk],
) -> List[Citation]:
    """Filter citations to only answer-supporting\
    
    sentences, returning unique results.
    """
    if not answer.strip():
        return []

    answer_embedding = _SENTENCE_MODEL.encode(answer, normalize_embeddings=True)

    filtered: List[Citation] = []
    seen_snippets = set()  # Track unique snippets

    for sc in chunks:
        sentences = _split_sentences(sc.chunk.text)
        if not sentences:
            continue

        sentence_embeddings = _SENTENCE_MODEL.encode(
            sentences,
            normalize_embeddings=True,
        )

        similarities = util.cos_sim(answer_embedding, sentence_embeddings)[0]

        selected_sentences: List[str] = []
        for sent, score in zip(sentences, similarities):
            if float(score) >= _SIMILARITY_THRESHOLD:
                selected_sentences.append(sent)

            if len(selected_sentences) >= _MAX_SENTENCES_PER_CHUNK:
                break

        if not selected_sentences:
            continue

        # Create the combined snippet string
        final_snippet = " ".join(selected_sentences)

        # CHECK FOR UNIQUENESS
        # We use a tuple of (page, snippet) to ensure
        # uniqueness across both content and source
        citation_key = (sc.chunk.page_start, sc.chunk.page_end, final_snippet)

        if citation_key not in seen_snippets:
            seen_snippets.add(citation_key)
            filtered.append(
                Citation(
                    page_start=sc.chunk.page_start,
                    page_end=sc.chunk.page_end,
                    snippet=final_snippet,
                )
            )

    return filtered
