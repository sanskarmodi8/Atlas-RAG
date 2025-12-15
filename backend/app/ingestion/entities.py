"""Load entities from chunk texts."""

from typing import List, Set

import spacy

# Load once at module import
NLP = spacy.load("en_core_web_sm")

# Entity labels we accept.
# Keep this BROAD on purpose.
ALLOWED_ENTITY_LABELS = {
    "PERSON",
    "ORG",
    "GPE",
    "LOC",
    "PRODUCT",
    "EVENT",
    "WORK_OF_ART",
    "LAW",
    "LANGUAGE",
    "NORP",
    "FAC",
}


def extract_entities(text: str) -> List[str]:
    """Extract entities from text using spaCy.

    Rules:
    - Deterministic (no LLM)
    - Preserve surface form
    - Deduplicate
    - Ignore very short / noisy entities
    """
    if not text.strip():
        return []

    doc = NLP(text)

    entities: Set[str] = set()

    for ent in doc.ents:
        if ent.label_ not in ALLOWED_ENTITY_LABELS:
            continue

        value = ent.text.strip()

        # Drop trivial junk
        if len(value) < 3 or len(value.split()) > 5:
            continue

        entities.add(value)

    return sorted(entities)
