"""Chat routes for RAG-based Q&A."""

from app.core.llm import llm_chat
from app.core.prompts import build_rag_prompt
from app.models.api import ChatRequest, ChatResponse, Citation
from app.retrieval.rag import retrieve_context
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def chat_basic(request: ChatRequest) -> ChatResponse:
    """Basic RAG Q&A endpoint."""
    contexts = retrieve_context(request.query, top_k=request.top_k)

    if not contexts:
        return ChatResponse(
            answer="I don't know based on the provided documents.",
            citations=[],
        )

    combined_context = "\n\n".join(
        f"(Pages {c['page_start']}–{c['page_end']}): {c['text']}" for c in contexts
    )

    messages = build_rag_prompt(combined_context, request.query)

    answer = llm_chat(messages=messages)

    citations = [
        Citation(
            page_start=c["page_start"],
            page_end=c["page_end"],
            snippet=c["text"][:200],
        )
        for c in contexts
    ]

    return ChatResponse(answer=answer, citations=citations)
