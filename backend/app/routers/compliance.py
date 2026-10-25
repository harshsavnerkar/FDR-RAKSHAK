import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fdr import FDR
from app.services import compliance_service, fdr_service
from app.schemas.compliance import (
    FDRComplianceReport,
    ComplianceBatchSummary,
    CustomComplianceRequest,
    ComplianceConfig
)

logger = logging.getLogger("fdr_rakshak.compliance_router")

router = APIRouter(prefix="/api/compliance", tags=["Compliance & Discrepancy Engine"])

@router.get("/summary", response_model=ComplianceBatchSummary)
def get_compliance_summary(
    approaching_maturity_days: int = Query(90, ge=1, le=365, description="Threshold days for approaching maturity"),
    amount_tolerance: float = Query(1.0, ge=0.0, description="Amount difference tolerance in INR"),
    ocr_confidence_threshold: float = Query(75.0, ge=0.0, le=100.0, description="Minimum OCR confidence for automated verification"),
    as_of: date | None = Query(None, description="Evaluation reference date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Evaluates rule-based compliance across all vaulted FDR instruments.
    Returns status distributions, average compliance scores, and flagged discrepancies.
    """
    cfg = ComplianceConfig(
        approaching_maturity_days=approaching_maturity_days,
        amount_tolerance=amount_tolerance,
        ocr_confidence_threshold=ocr_confidence_threshold
    )
    return compliance_service.evaluate_all_fdrs(db=db, config=cfg, as_of_date=as_of)

@router.get("/fdr/{fdr_id}", response_model=FDRComplianceReport)
def get_fdr_compliance_report(
    fdr_id: str,
    approaching_maturity_days: int = Query(90, ge=1, le=365),
    amount_tolerance: float = Query(1.0, ge=0.0),
    ocr_confidence_threshold: float = Query(75.0, ge=0.0, le=100.0),
    as_of: date | None = Query(None, description="Evaluation reference date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Generates an explainable compliance diagnostic report for a specific vaulted FDR.
    Audits 8 statutory rules including OCR discrepancy cross-checks, date sequences, and maturity horizons.
    """
    fdr = db.get(FDR, fdr_id)
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR instrument with ID '{fdr_id}' not found."
        )

    cfg = ComplianceConfig(
        approaching_maturity_days=approaching_maturity_days,
        amount_tolerance=amount_tolerance,
        ocr_confidence_threshold=ocr_confidence_threshold
    )
    return compliance_service.evaluate_fdr_compliance(fdr=fdr, config=cfg, as_of_date=as_of)

@router.post("/evaluate-custom", response_model=FDRComplianceReport)
def evaluate_custom_compliance(
    payload: CustomComplianceRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates compliance against a vaulted FDR record using newly uploaded or corrected OCR fields.
    Enables interactive discrepancy diffing before confirming database updates.
    """
    fdr = db.get(FDR, payload.fdr_id)
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR instrument with ID '{payload.fdr_id}' not found."
        )

    cfg = payload.config or ComplianceConfig()
    return compliance_service.evaluate_fdr_compliance(
        fdr=fdr,
        custom_doc_fields=payload.ocr_extracted_fields,
        custom_ocr_confidence=payload.ocr_confidence,
        config=cfg
    )
