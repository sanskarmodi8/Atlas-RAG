"""Routes for uploading and processing documents."""

import uuid
from pathlib import Path
from typing import Dict, List

from app.ingestion.pdf_loader import extract_pages
from app.models.schemas import RawSegment
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

DOC_STORAGE = Path("backend/storage/docs")


@router.post("/upload", response_model=Dict[str, List[RawSegment]])
def upload_documents(
    files: List[UploadFile] = File(...),
) -> Dict[str, List[RawSegment]]:
    """Upload one or more PDF documents and extract their pages.

    Args:
        files: Uploaded PDF files.

    Returns:
        A mapping of doc_id to raw extracted page segments.
    """
    results: Dict[str, List[RawSegment]] = {}

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            msg = "Only PDF files are supported."
            raise HTTPException(status_code=400, detail=msg)

        # Generate a unique document ID
        doc_id = str(uuid.uuid4())
        save_path = DOC_STORAGE / f"{doc_id}.pdf"

        with save_path.open("wb") as f:
            f.write(file.file.read())

        segments = extract_pages(save_path, doc_id)
        results[doc_id] = segments

    return results
