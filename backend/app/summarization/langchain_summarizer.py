"""LangChain-based document summarization using a local HF model."""

from typing import List

from app.models.ingestion import Chunk
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document
from langchain.llms import HuggingFacePipeline
from transformers import pipeline


class DocumentSummarizer:
    """Document summarizer using LangChain + local HF model."""

    def __init__(self) -> None:
        """Initialize HF Pipeline."""
        summarizer = pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            device=-1,
        )

        self.llm = HuggingFacePipeline(pipeline=summarizer)

        self.chain = load_summarize_chain(
            llm=self.llm,
            chain_type="map_reduce",
            verbose=False,
        )

    def summarize(self, chunks: List[Chunk]) -> str:
        """Summarize document chunks."""
        if not chunks:
            return "No content available to summarize."

        documents = [
            Document(
                page_content=chunk.text,
                metadata={
                    "doc_id": chunk.doc_id,
                    "page_start": chunk.page_start,
                    "page_end": chunk.page_end,
                },
            )
            for chunk in chunks
        ]

        return self.chain.run(documents)
