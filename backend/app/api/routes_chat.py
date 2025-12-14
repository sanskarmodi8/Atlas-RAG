"""Chat routes for hybrid RAG-based Q&A."""

from app.core.llm import llm_chat
from app.core.prompts import build_rag_prompt
from app.models.api import ChatRequest, ChatResponse, Citation
from app.retrieval.hybrid import hybrid_search
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def chat_hybrid(request: ChatRequest) -> ChatResponse:
    """Hybrid RAG Q&A endpoint (vector + BM25)."""
    # Hybrid retrieval
    chunks = hybrid_search(request.query, top_k=1)

    if not chunks:
        return ChatResponse(
            answer="I don't know based on the provided documents.",
            citations=[],
        )

    chunk = chunks[0]

    # Build prompt from ONLY the best chunk
    messages = build_rag_prompt(
        context=chunk.chunk.text,
        question=request.query,
    )

    # Ask LLM
    answer = llm_chat(messages=messages)

    # Cite ONLY what was used
    citations = [
        Citation(
            page_start=chunk.chunk.page_start,
            page_end=chunk.chunk.page_end,
            snippet=chunk.chunk.text[:300],
        )
    ]

    return ChatResponse(
        answer=answer,
        citations=citations,
    )
