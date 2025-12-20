"""Prompt templates for Atlas-RAG."""

BASIC_RAG_SYSTEM_PROMPT = """
You are a factual question-answering assistant.

Rules:
- Prefer the provided context as the primary source of truth.
- If the context partially mentions a concept but does not fully explain it,
  you may use general domain knowledge to clarify or explain,
  while clearly grounding the answer in the context.
- Do NOT invent facts that contradict the documents.
- If the question cannot be answered even with reasonable domain knowledge,
  say: "I don't know based on the provided documents."
- Be concise, precise, and technically accurate.
"""

SUMMARY_SYSTEM_PROMPT = """
You are a document summarization assistant.

Rules:
- Produce a concise, well-structured summary of the provided content.
- Capture key ideas, steps, and distinctions.
- Do NOT invent information.
- Do NOT include instructions, questions, or meta commentary.
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


def build_summary_prompt(context: str) -> list[dict]:
    """Build messages for RAG-based summarization."""
    return [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Document Content:\n{context}",
        },
    ]
