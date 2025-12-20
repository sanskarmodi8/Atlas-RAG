"""LangChain retriever wrapper for AtlasRAG."""

from typing import List

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from backend.app.retrieval.retrieve import hybrid_graph_search


class AtlasGraphRetriever(BaseRetriever):
    """LangChain-compatible retriever wrapping hybrid Graph-RAG."""

    top_k: int = 5

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Retrieve documents for LangChain."""
        results = hybrid_graph_search(query, self.top_k)

        documents: List[Document] = []

        for sc in results:
            documents.append(
                Document(
                    page_content=sc.chunk.text,
                    metadata={
                        "doc_id": sc.chunk.doc_id,
                        "page_start": sc.chunk.page_start,
                        "page_end": sc.chunk.page_end,
                        "chunk": sc.chunk,
                        "score": sc.score,
                    },
                )
            )

        return documents
