"""Query rewriting using conversation context."""

from typing import List, Tuple

from backend.app.core.llm import llm_chat

Message = Tuple[str, str]


_REWRITE_SYSTEM_PROMPT = """
You are a query rewriting assistant.

Given a conversation history and the latest user question,
rewrite the question into a standalone, explicit query
that can be understood without the conversation.

Rules:
- Do NOT answer the question.
- Do NOT add new information.
- Do NOT change the intent.
- If the question is already standalone, return it unchanged.
"""


def rewrite_query(
    question: str,
    history: List[Message],
) -> str:
    """Rewrite a context-dependent query into a standalone query."""
    if not history:
        return question

    history_text = "\n".join(f"{role}: {content}" for role, content in history)

    messages = [
        {"role": "system", "content": _REWRITE_SYSTEM_PROMPT.strip()},
        {
            "role": "user",
            "content": f"""
Conversation:
{history_text}

Latest question:
{question}

Standalone rewritten query:
""".strip(),
        },
    ]

    rewritten = llm_chat(messages=messages).strip()

    return rewritten or question
