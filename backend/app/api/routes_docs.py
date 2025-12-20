"""Routes for uploading and processing documents."""

import uuid
from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.app.config import settings
from backend.app.ingestion.pipeline import ingest_pdf
from backend.app.models.ingestion import Chunk
from backend.app.retrieval.chunk_registry import get_chunks

router = APIRouter()

DOC_STORAGE = Path(settings.docs_path)
DOC_STORAGE.mkdir(parents=True, exist_ok=True)


@router.post("/upload", response_model=Dict[str, List[Chunk]])
def upload_documents(
    files: List[UploadFile] = File(...),
) -> Dict[str, List[Chunk]]:
    """Upload one or more PDF documents.

    Args:
        files: Uploaded PDF files.

    Returns:
        A mapping of doc_id to raw extracted page segments.
    """
    results: Dict[str, List[Chunk]] = {}

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            msg = "Only PDF files are supported."
            raise HTTPException(status_code=400, detail=msg)

        # Generate a unique document ID
        doc_id = str(uuid.uuid4())
        save_path = DOC_STORAGE / f"{doc_id}.pdf"

        with save_path.open("wb") as f:
            f.write(file.file.read())

        chunks = ingest_pdf(save_path, doc_id)
        results[doc_id] = chunks

    return results


@router.delete("/remove/{doc_id}")
def remove_document(doc_id: str) -> dict:
    """Remove a document and its chunks from the system.

    Args:
        doc_id: Document ID to remove

    Returns:
        Status message
    """
    from backend.app.ingestion.indexing import COLLECTION_NAME, get_qdrant_client
    from backend.app.retrieval.chunk_registry import _CHUNKS

    # Remove chunks from registry
    chunks_to_remove = [cid for cid, chunk in _CHUNKS.items() if chunk.doc_id == doc_id]
    for chunk_id in chunks_to_remove:
        _CHUNKS.pop(chunk_id, None)

    # Remove from Qdrant
    if chunks_to_remove:
        try:
            client = get_qdrant_client()
            if client.collection_exists(COLLECTION_NAME):
                client.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=chunks_to_remove,
                )
        except Exception as e:
            print(f"Error removing from Qdrant: {e}")

    # Remove PDF file
    pdf_path = DOC_STORAGE / f"{doc_id}.pdf"
    if pdf_path.exists():
        pdf_path.unlink()

    return {
        "status": "success",
        "message": f"Removed document {doc_id}",
        "chunks_removed": len(chunks_to_remove),
    }


@router.get("/list")
def list_documents() -> dict:
    """List all currently loaded documents.

    Returns:
        Dictionary with document information
    """
    chunks = get_chunks()
    doc_ids = list(set(chunk.doc_id for chunk in chunks))

    return {
        "total_documents": len(doc_ids),
        "total_chunks": len(chunks),
        "doc_ids": doc_ids,
    }
