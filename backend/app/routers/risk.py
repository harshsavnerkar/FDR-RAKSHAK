import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.fdr import FDR
from app.schemas.risk import (
    MaturityRiskSummary,
    FDRRiskAssessment,
    MaturityCategory,
    RiskPriority
)
from app.services import risk_service

logger = logging.getLogger("fdr_rakshak.risk_router")

router = APIRouter(prefix="/api/risk", tags=["Maturity Tracking & Risk Prioritization"])

@router.get("/summary", response_model=MaturityRiskSummary)
def get_risk_summary(
    as_of: date | None = Query(None, description="Reference calculation date (defaults to server today)"),
    priority: str | None = Query(None, description="Filter prioritized queue by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    maturity: str | None = Query(None, description="Filter prioritized queue by maturity window (EXPIRED, MATURING_30_DAYS, etc.)"),
    compliance: str | None = Query(None, description="Filter prioritized queue by compliance status (COMPLIANT, ACTION_REQUIRED, NON_COMPLIANT, UNDER_REVIEW)"),
    db: Session = Depends(get_db)
):
    """
    Retrieves overarching maturity tracking analytics, priority breakdowns,
    and a prioritized action list of FDR security deposit instruments.
    """
    return risk_service.evaluate_all_fdrs_risk(
        db=db,
        as_of=as_of,
        priority_filter=priority,
        maturity_filter=maturity,
        compliance_filter=compliance
    )

@router.get("/prioritized", response_model=list[FDRRiskAssessment])
def get_prioritized_fdrs(
    as_of: date | None = Query(None, description="Reference date for maturity calculations"),
    priority: str | None = Query(None, description="Optional priority level filter"),
    maturity: str | None = Query(None, description="Optional maturity category filter"),
    compliance: str | None = Query(None, description="Optional compliance status filter"),
    db: Session = Depends(get_db)
):
    """
    Returns the deterministic prioritized queue of FDR instruments sorted from most urgent
    (Critical / Expired / Non-Compliant) to least urgent (Low / Beyond 90 Days).
    """
    summary = risk_service.evaluate_all_fdrs_risk(
        db=db,
        as_of=as_of,
        priority_filter=priority,
        maturity_filter=maturity,
        compliance_filter=compliance
    )
    return summary.prioritized_queue

@router.get("/fdr/{fdr_id}", response_model=FDRRiskAssessment)
def get_fdr_risk_assessment(
    fdr_id: str,
    as_of: date | None = Query(None, description="Reference calculation date"),
    db: Session = Depends(get_db)
):
    """
    Retrieves detailed maturity tracking, explainable risk factors, supporting evidence,
    and recommended next actions for an individual FDR instrument.
    """
    fdr = db.scalar(select(FDR).where(FDR.id == fdr_id))
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR instrument with ID '{fdr_id}' not found."
        )

    return risk_service.evaluate_fdr_risk(fdr=fdr, as_of=as_of)
