"""Chat routes for QA and summarization."""

from app.core.llm import llm_chat
from app.core.prompts import build_rag_prompt, build_summary_prompt
from app.memory.conversation import conversation_memory
from app.memory.query_rewriter import rewrite_query
from app.models.api import ChatRequest, ChatResponse
from app.retrieval.chunk_registry import get_chunks
from app.retrieval.citation_filter import filter_citations
from app.retrieval.retrieve import hybrid_graph_search
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Unified QA + Summarization endpoint with memory and query rewriting."""
    session_id = request.session_id

    # SUMMARIZATION MODE
    if request.mode == "summarize":
        chunks = get_chunks()

        if not chunks:
            return ChatResponse(
                answer="No documents available to summarize.",
                citations=[],
            )

        # Filter chunks by selected doc_ids if provided
        if request.doc_ids:
            chunks = [chunk for chunk in chunks if chunk.doc_id in request.doc_ids]

            if not chunks:
                return ChatResponse(
                    answer="No content found for the selected documents.",
                    citations=[],
                )

        # ADD TOKEN CHECK HERE
        context = "\n\n".join(chunk.text for chunk in chunks)
        estimated_tokens = len(context) // 4

        from app.config import settings

        if estimated_tokens > settings.max_summary_tokens:
            return ChatResponse(
                answer=f"The selected documents are too large \
to summarize ({estimated_tokens:,} tokens). "
                f"Maximum allowed: {settings.max_summary_tokens:,} tokens. "
                f"Please select fewer documents or upload smaller PDFs.",
                citations=[],
            )

        messages = build_summary_prompt(context)

        answer = llm_chat(messages=messages)

        # Store conversation
        conversation_memory.add_user_message(session_id, request.query)
        conversation_memory.add_assistant_message(session_id, answer)

        return ChatResponse(
            answer=answer,
            citations=[],
        )

    # QA MODE (DEFAULT)

    # 1. Load conversation history
    history = conversation_memory.get_history(session_id)

    # 2. Rewrite query using history
    rewritten_query = rewrite_query(
        question=request.query,
        history=history,
    )

    # 3. Retrieve documents
    results = hybrid_graph_search(rewritten_query, request.top_k)

    # Filter results by selected doc_ids if provided
    if request.doc_ids:
        results = [r for r in results if r.chunk.doc_id in request.doc_ids]

    if not results:
        return ChatResponse(
            answer="I don't know based on the provided documents.",
            citations=[],
        )

    # 4. Build prompt
    context = "\n\n".join(sc.chunk.text for sc in results)
    messages = build_rag_prompt(
        context=context,
        question=rewritten_query,
    )

    # 5. Generate answer
    answer = llm_chat(messages=messages)

    # 6. Filter citations
    citations = filter_citations(
        answer=answer,
        chunks=results,
    )

    # 7. Store conversation
    conversation_memory.add_user_message(session_id, request.query)
    conversation_memory.add_assistant_message(session_id, answer)

    return ChatResponse(
        answer=answer,
        citations=citations,
    )


@router.post("/clear")
def clear_conversation(session_id: str = "default") -> dict:
    """Clear conversation history for a session."""
    conversation_memory.clear(session_id)
    return {"status": "success", "message": "Conversation cleared"}
