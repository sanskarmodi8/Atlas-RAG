"""Chat routes for Graph-RAG."""

from app.core.llm import llm_chat
from app.core.prompts import build_rag_prompt
from app.models.api import ChatRequest, ChatResponse, Citation
from app.retrieval.retrieve import hybrid_graph_search
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Graph-augmented RAG endpoint."""
    results = hybrid_graph_search(request.query, request.top_k)

    if not results:
        return ChatResponse(
            answer="I don't know based on the provided documents.",
            citations=[],
        )

    context = "\n\n".join(sc.chunk.text for sc in results)

    messages = build_rag_prompt(
        context=context,
        question=request.query,
    )

    answer = llm_chat(messages=messages)

    citations = [
        Citation(
            page_start=sc.chunk.page_start,
            page_end=sc.chunk.page_end,
            snippet=sc.chunk.text[:300],
        )
        for sc in results
    ]

    return ChatResponse(answer=answer, citations=citations)
