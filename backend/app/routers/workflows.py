import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.workflow import (
    RenewalInitiateRequest,
    ReplacementInitiateRequest,
    ReleaseInitiateRequest,
    WorkflowDecisionRequest,
    WorkflowItemOut,
    FDRLifecycleOverview,
    WorkflowBatchSummary
)
from app.services import workflow_service

logger = logging.getLogger("fdr_smartguard.workflows_router")

router = APIRouter(prefix="/api/workflows", tags=["FDR Lifecycle & Controlled Workflows"])

@router.get("/summary", response_model=WorkflowBatchSummary)
def get_workflow_summary(db: Session = Depends(get_db)):
    """
    Retrieves overarching lifecycle statistics, pending request counts, and recent workflow activity logs.
    """
    return workflow_service.get_workflow_summary(db=db)

@router.get("/fdr/{fdr_id}", response_model=FDRLifecycleOverview)
def get_fdr_lifecycle_overview(fdr_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full lifecycle state, active pending requests, audit history, and permissible actions for an FDR.
    """
    return workflow_service.get_fdr_lifecycle_overview(db=db, fdr_id=fdr_id)

@router.post("/fdr/{fdr_id}/renew", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_renewal(
    fdr_id: str,
    req: RenewalInitiateRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates a controlled renewal request for an active FDR instrument.
    Transitions lifecycle state to RENEWAL_PENDING until explicitly approved.
    """
    return workflow_service.initiate_renewal(db=db, fdr_id=fdr_id, req=req)

@router.post("/fdr/{fdr_id}/replace", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_replacement(
    fdr_id: str,
    req: ReplacementInitiateRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates a replacement request for damaged or superseded FDR documents.
    Transitions lifecycle state to REPLACEMENT_PENDING and prevents duplicate active instruments.
    """
    return workflow_service.initiate_replacement(db=db, fdr_id=fdr_id, req=req)

@router.post("/fdr/{fdr_id}/release", response_model=WorkflowItemOut, status_code=status.HTTP_201_CREATED)
def initiate_release(
    fdr_id: str,
    req: ReleaseInitiateRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates an administrative deposit release/refund request.
    Transitions lifecycle state to RELEASE_REQUESTED. Requires explicit human approval.
    """
    return workflow_service.initiate_release(db=db, fdr_id=fdr_id, req=req)

@router.post("/{workflow_id}/decide", response_model=WorkflowItemOut)
def process_workflow_decision(
    workflow_id: str,
    decision_req: WorkflowDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Approves or rejects a pending workflow request.
    Applies updates atomically via database transaction and records immutable audit notes.
    """
    return workflow_service.process_workflow_decision(
        db=db,
        workflow_id=workflow_id,
        decision_req=decision_req
    )
