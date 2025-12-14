"""Text cleaning utilities for document ingestion."""

import re


def clean_text(text: str) -> str:
    """Clean extracted PDF text.

    - Fix hyphenated line breaks
    - Normalize whitespace
    - Remove excessive newlines
    """
    if not text:
        return ""

    # Fix hyphenated words across line breaks
    text = re.sub(r"-\n", "", text)

    # Replace newlines with spaces
    text = re.sub(r"\n+", " ", text)

    # Normalize multiple spaces
    text = re.sub(r"\s{2,}", " ", text)

    return text.strip()
