"""Document summarization route (LangChain-based)."""

from app.models.api import ChatResponse
from app.retrieval.chunk_registry import get_chunks
from app.summarization.langchain_summarizer import DocumentSummarizer
from fastapi import APIRouter, HTTPException

router = APIRouter()
summarizer = DocumentSummarizer()


@router.post("/langchain", response_model=ChatResponse)
def summarize_document() -> ChatResponse:
    """Summarize all ingested documents.

    Note:
    - This is recall-heavy by design
    - No citations (summary ≠ factual QA)
    """
    chunks = get_chunks()

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No documents available for summarization.",
        )

    summary = summarizer.summarize(chunks)

    return ChatResponse(
        answer=summary,
        citations=[],
    )
