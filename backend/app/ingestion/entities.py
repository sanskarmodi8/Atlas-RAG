"""Concept extraction for Graph-RAG.

This module extracts high-signal, document-agnostic concepts
used to build the knowledge graph.
"""

from typing import List, Set

import spacy

NLP = spacy.load("en_core_web_sm")

_ALLOWED_LABELS = {
    "ORG",
    "PRODUCT",
    "WORK_OF_ART",
    "LANGUAGE",
    "EVENT",
}


def extract_entities(text: str) -> List[str]:
    """Extract high-quality concepts from text.

    Strategy:
    - spaCy named entities (filtered)
    - noun chunks (2–4 tokens)
    - deduplicated, normalized
    """
    if not text.strip():
        return []

    doc = NLP(text)
    concepts: Set[str] = set()

    # 1. Named entities
    for ent in doc.ents:
        if ent.label_ in _ALLOWED_LABELS:
            value = ent.text.strip()
            if 3 <= len(value) <= 60:
                concepts.add(value)

    # 2. Noun chunks (technical phrases)
    for chunk in doc.noun_chunks:
        value = chunk.text.strip()
        word_count = len(value.split())

        if 2 <= word_count <= 4 and value[0].isupper() and not value.isnumeric():
            concepts.add(value)

    return sorted(concepts)
