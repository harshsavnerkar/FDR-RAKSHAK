import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import AdminUser
from app.dependencies.auth import get_optional_current_admin
from app.services import fdr_service
from app.schemas.workflow import (
    RenewalInitiateRequest,
    ReplacementInitiateRequest,
    ReleaseInitiateRequest,
    WorkflowDecisionRequest,
    WorkflowStatus,
    WorkflowItemOut,
    FDRLifecycleOverview,
    WorkflowBatchSummary
)
from app.services import workflow_service

logger = logging.getLogger("fdr_rakshak.workflows_router")

router = APIRouter(prefix="/api/workflows", tags=["FDR Lifecycle & Controlled Workflows"])

@router.get("/summary", response_model=WorkflowBatchSummary)
def get_workflow_summary(db: Session = Depends(get_db)):
    """
    Retrieves overarching lifecycle statistics, pending request counts, and recent workflow activity logs.
    """
    return workflow_service.get_workflow_summary(db=db)

@router.get("/fdr/{fdr_id}", response_model=FDRLifecycleOverview)
def get_fdr_lifecycle_overview(
    fdr_id: str,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Retrieves full lifecycle state, active pending requests, audit history, and permissible actions for an FDR.
    """
    fdr = fdr_service.get_fdr(db=db, fdr_id=fdr_id)
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        if fdr.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users can only view workflows for their own institution."
            )
    return workflow_service.get_fdr_lifecycle_overview(db=db, fdr_id=fdr_id)

@router.post("/fdr/{fdr_id}/renew", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_renewal(
    fdr_id: str,
    req: RenewalInitiateRequest,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Initiates a controlled renewal request for an active FDR instrument.
    Transitions lifecycle state to RENEWAL_PENDING until explicitly approved.
    """
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        fdr = fdr_service.get_fdr(db=db, fdr_id=fdr_id)
        if fdr.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users can only initiate renewal for their own instruments."
            )
        req.requested_by = current_admin.display_name or current_admin.username
    return workflow_service.initiate_renewal(db=db, fdr_id=fdr_id, req=req)

@router.post("/fdr/{fdr_id}/replace", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_replacement(
    fdr_id: str,
    req: ReplacementInitiateRequest,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Initiates a replacement request for damaged or superseded FDR documents.
    Transitions lifecycle state to REPLACEMENT_PENDING and prevents duplicate active instruments.
    """
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        fdr = fdr_service.get_fdr(db=db, fdr_id=fdr_id)
        if fdr.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users can only initiate replacement for their own instruments."
            )
        req.requested_by = current_admin.display_name or current_admin.username
    return workflow_service.initiate_replacement(db=db, fdr_id=fdr_id, req=req)

@router.post("/fdr/{fdr_id}/release", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_release(
    fdr_id: str,
    req: ReleaseInitiateRequest,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Initiates an administrative deposit release/refund request.
    Transitions lifecycle state to RELEASE_REQUESTED. Requires explicit human approval.
    """
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        fdr = fdr_service.get_fdr(db=db, fdr_id=fdr_id)
        if fdr.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users can only initiate release for their own instruments."
            )
        req.requested_by = current_admin.display_name or current_admin.username
    return workflow_service.initiate_release(db=db, fdr_id=fdr_id, req=req)

@router.post("/{workflow_id}/decide", response_model=WorkflowItemOut)
def process_workflow_decision(
    workflow_id: str,
    decision_req: WorkflowDecisionRequest,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Approves or rejects a pending workflow request.
    Applies updates atomically via database transaction and records immutable audit notes.
    Enforces Maker-Checker:
    - Scrutiny Officer CANNOT approve release requests (can only reject or recommend).
    - Institutional Users and Bank Nodes CANNOT decide workflow requests.
    - Bureau Chief holds final approval authority.
    """
    if current_admin:
        if current_admin.role in ("INSTITUTION_USER", "BANK_NODE"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{current_admin.role}' cannot adjudicate regulatory workflow requests."
            )
        if current_admin.role == "SCRUTINY_OFFICER" and decision_req.decision == WorkflowStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maker-Checker Security Violation: Scrutiny Officers cannot authorize or approve releases. Scrutiny officers may only audit documents and recommend approval. Final release requires AICTE Bureau Chief clearance."
            )

    return workflow_service.process_workflow_decision(
        db=db,
        workflow_id=workflow_id,
        decision_req=decision_req
    )
