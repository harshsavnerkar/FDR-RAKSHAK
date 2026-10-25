import os
import uuid
import re
import logging
from pathlib import Path
from typing import Any
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.config import (
    UPLOAD_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_UPLOAD_EXTENSIONS,
    ALLOWED_MIME_TYPES
)
from app.services import ocr_service
from app.services import fdr_service
from app.schemas.document import DocumentUploadResponse, DocumentFields, DocumentLinkRequest

logger = logging.getLogger("fdr_rakshak.documents")

# In-memory document registry cache for uploaded sessions
_UPLOAD_REGISTRY: dict[str, dict[str, Any]] = {}

MAGIC_SIGNATURES = {
    ".pdf": b"%PDF",
    ".png": b"\x89PNG\r\n\x1a\n",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff"
}

def sanitize_filename(filename: str) -> str:
    """Removes path traversals and illegal filesystem characters."""
    base = Path(filename).name
    # Keep only alphanumeric, dash, underscore, dot
    clean = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return clean[:120] if clean else "unnamed_document"

def validate_magic_bytes(data: bytes, ext: str) -> bool:
    """Validates file magic header bytes to prevent disguised executable uploads."""
    expected = MAGIC_SIGNATURES.get(ext)
    if not expected:
        return False
    return data.startswith(expected)

async def handle_document_upload(file: UploadFile) -> DocumentUploadResponse:
    """Validates, securely stores, and performs OCR extraction on uploaded document."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    orig_clean = sanitize_filename(file.filename)
    ext = Path(orig_clean).suffix.lower()

    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed formats: PDF, PNG, JPEG."
        )

    # Read content into memory for validation
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        max_mb = MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowable limit of {max_mb} MB."
        )

    # Validate Magic Bytes
    if not validate_magic_bytes(content[:16], ext):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File header does not match expected signature for {ext.upper()}."
        )

    # Generate safe server-side storage filename
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}{ext}"
    stored_path = UPLOAD_DIR / safe_filename

    # Ensure path stays strictly within UPLOAD_DIR
    if stored_path.resolve().parent != UPLOAD_DIR.resolve():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal file storage path detected."
        )

    # Write file to safe uploads directory
    try:
        with open(stored_path, "wb") as f:
            f.write(content)
    except Exception as exc:
        logger.error(f"Failed to persist uploaded document: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store document on server."
        )

    # Perform OCR Extraction
    try:
        raw_text, engine_used = ocr_service.extract_text(stored_path, file.content_type or "")
        parsed = ocr_service.parse_fdr_fields(raw_text)
    except Exception as exc:
        logger.error(f"Error during OCR extraction: {exc}")
        raw_text = ""
        engine_used = f"Extraction error: {type(exc).__name__}"
        parsed = ocr_service.parse_fdr_fields("")

    fields_data = DocumentFields(**parsed["fields"])

    response_obj = DocumentUploadResponse(
        document_id=doc_id,
        filename=safe_filename,
        original_filename=orig_clean,
        file_type=file.content_type or f"application/{ext.lstrip('.')}",
        file_size=file_size,
        engine_used=engine_used,
        raw_text=raw_text,
        extracted_fields=fields_data,
        field_confidence=parsed["fieldConfidence"],
        overall_confidence=parsed["overallConfidence"],
        ambiguities=parsed["ambiguities"],
        is_complete=parsed["isComplete"]
    )

    # Register in memory cache
    _UPLOAD_REGISTRY[doc_id] = {
        "metadata": response_obj.model_dump(by_alias=True),
        "storedPath": str(stored_path),
        "fdrId": None
    }

    return response_obj

def get_document_preview_path(document_id: str) -> tuple[Path, str]:
    """Safely retrieves document file path and MIME type for authorized preview."""
    # Validate UUID pattern to prevent path traversal
    if not re.match(r"^[a-f0-9-]{36}$", document_id, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Invalid document ID format.")

    # Locate in upload directory
    matches = list(UPLOAD_DIR.glob(f"{document_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc_path = matches[0]
    if doc_path.resolve().parent != UPLOAD_DIR.resolve():
        raise HTTPException(status_code=400, detail="Access denied.")

    ext = doc_path.suffix.lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
    }
    return doc_path, mime_map.get(ext, "application/octet-stream")

def link_document_to_fdr(
    db: Session,
    document_id: str,
    payload: DocumentLinkRequest
) -> dict[str, Any]:
    """Links an uploaded document record to an existing vaulted FDR record in PostgreSQL."""
    # Verify FDR exists
    fdr_record = fdr_service.get_fdr(db=db, fdr_id=payload.fdr_id)
    if not fdr_record:
        raise HTTPException(status_code=404, detail=f"FDR record '{payload.fdr_id}' not found.")

    doc_info = _UPLOAD_REGISTRY.get(document_id)
    stored_path, mime = get_document_preview_path(document_id)

    # Check for discrepancy notes or update notes
    discrepancy_entries = []
    if payload.notes:
        discrepancy_entries.append(f"Verification Note: {payload.notes}")

    if doc_info:
        extracted = doc_info["metadata"].get("extractedFields", {})
        ocr_conf = doc_info["metadata"].get("overallConfidence", 90.0)
        orig_name = doc_info["metadata"].get("originalFilename", "Uploaded Scan")

        # Check for discrepancies against existing vaulted values
        existing_amt = float(fdr_record.deposit_amount)
        new_amt = extracted.get("depositAmount")
        if new_amt and abs(existing_amt - float(new_amt)) > 0.01:
            discrepancy_entries.append(
                f"DISCREPANCY: Vault amount (₹{existing_amt:,.2f}) differs from document scan (₹{float(new_amt):,.2f})."
            )

        existing_ref = fdr_record.reference
        new_ref = extracted.get("reference")
        if new_ref and existing_ref.upper() != new_ref.upper():
            discrepancy_entries.append(
                f"DISCREPANCY: Vault ref '{existing_ref}' differs from document scan '{new_ref}'."
            )

        # Update FDR record metadata
        from app.schemas.fdr import FDRUpdate
        update_dict: dict[str, Any] = {
            "physical_location": f"Vault Tray 01 / Linked to scan: {orig_name}",
            "ocr_confidence": ocr_conf
        }
        if discrepancy_entries:
            existing_note = fdr_record.discrepancy_note or ""
            combined_notes = (existing_note + "\n" + "\n".join(discrepancy_entries)).strip()
            update_dict["discrepancy_note"] = combined_notes
            update_dict["verification_status"] = "Discrepancy"
        else:
            update_dict["verification_status"] = "Verified"

        # If user explicitly requested field overwrite
        if payload.update_vault_record and payload.corrected_fields:
            for k, v in payload.corrected_fields.items():
                if hasattr(fdr_record, k) and v is not None:
                    update_dict[k] = v

        fdr_service.update_fdr(db=db, fdr_id=payload.fdr_id, data=FDRUpdate(**update_dict))
        doc_info["fdrId"] = payload.fdr_id

    return {
        "status": "success",
        "message": f"Document successfully linked to FDR '{fdr_record.reference}'.",
        "documentId": document_id,
        "fdrId": payload.fdr_id,
        "fdrReference": fdr_record.reference,
        "discrepanciesDetected": len(discrepancy_entries) > 0,
        "notes": discrepancy_entries
    }
