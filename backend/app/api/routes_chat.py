"""Chat routes for QA and summarization."""

from app.core.llm import llm_chat
from app.core.prompts import build_rag_prompt, build_summary_prompt
from app.models.api import ChatRequest, ChatResponse
from app.retrieval.chunk_registry import get_chunks
from app.retrieval.citation_filter import filter_citations
from app.retrieval.retrieve import hybrid_graph_search
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Unified QA + Summarization endpoint."""
    if request.mode == "summarize":
        # Summarization uses ALL chunks (no top_k truncation)
        chunks = get_chunks()

        if not chunks:
            return ChatResponse(
                answer="No documents available to summarize.",
                citations=[],
            )

        context = "\n\n".join(chunk.text for chunk in chunks)
        messages = build_summary_prompt(context)

        answer = llm_chat(messages=messages)

        # no citations for summarization
        citations = []

        return ChatResponse(answer=answer, citations=citations)

    # QA MODE (default)
    results = hybrid_graph_search(request.query, request.top_k)

    if not results:
        return ChatResponse(
            answer="I don't know based on the provided documents.",
            citations=[],
        )

    context = "\n\n".join(sc.chunk.text for sc in results)
    messages = build_rag_prompt(context, request.query)

    answer = llm_chat(messages=messages)
    citations = filter_citations(answer=answer, chunks=results)

    return ChatResponse(answer=answer, citations=citations)
