"""Prompt templates for Atlas-RAG."""

BASIC_RAG_SYSTEM_PROMPT = """
You are a factual question-answering assistant.

Rules:
- Use ONLY the provided context to answer.
- If the answer is not present, say "I don't know based on the provided documents."
- Be concise and precise.
- Do NOT add external knowledge.
"""


def build_rag_prompt(context: str, question: str) -> list[dict]:
    """Build messages for RAG-based QA."""
    return [
        {"role": "system", "content": BASIC_RAG_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"""
Context:
{context}

Question:
{question}
""".strip(),
        },
    ]
