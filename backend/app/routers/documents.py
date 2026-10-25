import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import (
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_UPLOAD_EXTENSIONS,
    ALLOWED_MIME_TYPES
)
from app.services import document_service
from app.services import ocr_service
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentLinkRequest,
    OCRStatusResponse
)

logger = logging.getLogger("fdr_rakshak.documents_router")

router = APIRouter(prefix="/api/documents", tags=["FDR Document OCR & Verification"])

@router.get("/status", response_model=OCRStatusResponse)
def get_ocr_engine_status():
    """Retrieve operational status of server OCR engines and upload constraints."""
    info = ocr_service.check_ocr_availability()
    return OCRStatusResponse(
        pdf_engine_available=info["pdfEngineAvailable"],
        pdf_engine=info["pdfEngine"],
        tesseract_available=info["tesseractAvailable"],
        tesseract_path=info["tesseractPath"],
        max_upload_size_bytes=MAX_UPLOAD_SIZE_BYTES,
        allowed_extensions=sorted(list(ALLOWED_UPLOAD_EXTENSIONS)),
        allowed_mime_types=sorted(list(ALLOWED_MIME_TYPES))
    )

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_fdr_document(
    file: UploadFile = File(..., description="FDR Document scan (PDF, PNG, or JPEG; max 10MB)")
):
    """
    Securely uploads an FDR document scan, validates headers, and extracts fields via OCR.
    Never fabricates values; retains raw text for administrative officer review.
    """
    return await document_service.handle_document_upload(file=file)

@router.post("/{document_id}/link")
def link_document_to_fdr(
    document_id: str,
    payload: DocumentLinkRequest,
    db: Session = Depends(get_db)
):
    """
    Links an uploaded document scan to an existing FDR record in PostgreSQL.
    Audits for discrepancies between physical receipt scan and vaulted database values.
    """
    return document_service.link_document_to_fdr(
        db=db,
        document_id=document_id,
        payload=payload
    )

@router.get("/{document_id}/preview")
def preview_uploaded_document(document_id: str):
    """
    Safely delivers document binary for in-browser verification preview.
    Enforces strict UUID validation and nosniff protection.
    """
    doc_path, media_type = document_service.get_document_preview_path(document_id)
    return FileResponse(
        path=str(doc_path),
        media_type=media_type,
        headers={
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": f"inline; filename={doc_path.name}"
        }
    )
