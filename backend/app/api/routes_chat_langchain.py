"""Chat routes using LangChain retriever."""

from fastapi import APIRouter
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq

from backend.app.config import settings
from backend.app.models.api import ChatRequest, ChatResponse
from backend.app.models.retrieval import ScoredChunk
from backend.app.retrieval.citation_filter import filter_citations
from backend.app.retrieval.langchain_retriever import AtlasGraphRetriever

router = APIRouter()


@router.post("/ask/langchain", response_model=ChatResponse)
def chat_langchain(request: ChatRequest) -> ChatResponse:
    """LangChain-powered RAG endpoint with citation filtering."""
    retriever = AtlasGraphRetriever(top_k=request.top_k)

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.default_model,
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
    )

    result = qa_chain.invoke({"query": request.query})

    answer = result["result"]
    source_docs = result.get("source_documents", [])

    # Convert LangChain docs → ScoredChunk
    scored_chunks = [
        ScoredChunk(
            chunk=doc.metadata["chunk"],
            score=doc.metadata["score"],
        )
        for doc in source_docs
    ]

    citations = filter_citations(
        answer=answer,
        chunks=scored_chunks,
    )

    return ChatResponse(
        answer=answer,
        citations=citations,
    )
