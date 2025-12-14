"""Routes for uploading and processing documents."""

import uuid
from pathlib import Path
from typing import Dict, List

from app.ingestion.pipeline import ingest_pdf
from app.models.ingestion import Chunk
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

DOC_STORAGE = Path("backend/storage/docs")


@router.post("/upload", response_model=Dict[str, List[Chunk]])
def upload_documents(
    files: List[UploadFile] = File(...),
) -> Dict[str, List[Chunk]]:
    """Upload one or more PDF documents and extract their pages.

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
