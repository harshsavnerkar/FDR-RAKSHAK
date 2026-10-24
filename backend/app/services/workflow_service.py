import json
import logging
import uuid
from datetime import date, datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.models.fdr import FDR
from app.models.workflow import FDRWorkflow
from app.schemas.workflow import (
    LifecycleState,
    WorkflowType,
    WorkflowStatus,
    RenewalInitiateRequest,
    ReplacementInitiateRequest,
    ReleaseInitiateRequest,
    WorkflowDecisionRequest,
    WorkflowItemOut,
    FDRLifecycleOverview,
    WorkflowBatchSummary
)

logger = logging.getLogger("fdr_smartguard.workflow_service")

def _parse_proposed_changes(text: str | None) -> dict[str, Any]:
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        return {"raw": text}

def _to_workflow_out(wf: FDRWorkflow) -> WorkflowItemOut:
    return WorkflowItemOut(
        id=wf.id,
        fdr_id=wf.fdr_id,
        workflow_type=wf.workflow_type,
        status=wf.status,
        reason=wf.reason,
        request_date=wf.request_date,
        requested_by=wf.requested_by,
        proposed_changes=_parse_proposed_changes(wf.proposed_changes),
        decision_date=wf.decision_date,
        decided_by=wf.decided_by,
        decision_notes=wf.decision_notes,
        previous_lifecycle_status=wf.previous_lifecycle_status,
        created_at=wf.created_at,
        updated_at=wf.updated_at
    )

def _get_fdr_or_404(db: Session, fdr_id: str) -> FDR:
    fdr = db.scalar(select(FDR).where(FDR.id == fdr_id))
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR instrument with ID '{fdr_id}' not found."
        )
    return fdr

def _ensure_no_active_workflow(fdr: FDR):
    if fdr.lifecycle_status in (
        LifecycleState.RENEWAL_PENDING.value,
        LifecycleState.REPLACEMENT_PENDING.value,
        LifecycleState.RELEASE_REQUESTED.value
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"FDR instrument '{fdr.reference}' is currently in state '{fdr.lifecycle_status}'. "
                "Another workflow cannot be initiated until the pending request is approved or rejected."
            )
        )
    if fdr.lifecycle_status == LifecycleState.RELEASED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FDR instrument '{fdr.reference}' has already been formally RELEASED. No further actions permitted."
        )

def initiate_renewal(db: Session, fdr_id: str, req: RenewalInitiateRequest) -> WorkflowItemOut:
    """
    Initiates a controlled renewal workflow for an active FDR instrument.
    Records proposed new maturity date and terms without modifying the active record until approved.
    """
    fdr = _get_fdr_or_404(db, fdr_id)
    _ensure_no_active_workflow(fdr)

    # Validate proposed maturity date is in future
    if req.proposed_maturity_date <= date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Proposed maturity date ({req.proposed_maturity_date}) must be in the future (after {date.today()})."
        )

    # Persist workflow request
    wf_id = f"WF-REN-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    changes_payload = {
        "originalMaturityDate": str(fdr.maturity_date),
        "proposedMaturityDate": str(req.proposed_maturity_date),
        "proposedInterestRate": req.proposed_interest_rate,
        "renewalCertificateNo": req.renewal_certificate_no,
        "extendedTenureMonths": req.extended_tenure_months,
        "notes": req.notes
    }

    workflow = FDRWorkflow(
        id=wf_id,
        fdr_id=fdr.id,
        workflow_type=WorkflowType.RENEWAL.value,
        status=WorkflowStatus.PENDING.value,
        reason=req.reason,
        request_date=date.today(),
        requested_by=req.requested_by,
        proposed_changes=json.dumps(changes_payload),
        previous_lifecycle_status=fdr.lifecycle_status or LifecycleState.ACTIVE.value
    )

    # Transition FDR lifecycle state
    fdr.lifecycle_status = LifecycleState.RENEWAL_PENDING.value
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    logger.info(f"Renewal workflow {wf_id} initiated for FDR {fdr.reference} by {req.requested_by}.")
    return _to_workflow_out(workflow)

def initiate_replacement(db: Session, fdr_id: str, req: ReplacementInitiateRequest) -> WorkflowItemOut:
    """
    Initiates a replacement workflow for damaged, superseded, or updated FDR certificates.
    Enforces uniqueness of the replacement reference across all active instruments.
    """
    fdr = _get_fdr_or_404(db, fdr_id)
    _ensure_no_active_workflow(fdr)

    # Ensure new reference does not collide with existing active FDRs
    existing_ref = db.scalar(
        select(FDR).where(
            FDR.reference == req.new_reference,
            FDR.id != fdr.id
        )
    )
    if existing_ref:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active FDR instrument already exists with reference '{req.new_reference}'. Duplicate reference prohibited."
        )

    wf_id = f"WF-REP-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    changes_payload = {
        "originalReference": fdr.reference,
        "newReference": req.new_reference,
        "originalCertificateNo": fdr.certificate_no,
        "newCertificateNo": req.new_certificate_no,
        "replacementReason": req.replacement_reason,
        "newBankName": req.new_bank_name or fdr.bank_name,
        "newBranch": req.new_branch or fdr.branch,
        "newIfsc": req.new_ifsc or fdr.ifsc,
        "newDocumentId": req.new_document_id,
        "notes": req.notes
    }

    workflow = FDRWorkflow(
        id=wf_id,
        fdr_id=fdr.id,
        workflow_type=WorkflowType.REPLACEMENT.value,
        status=WorkflowStatus.PENDING.value,
        reason=req.reason,
        request_date=date.today(),
        requested_by=req.requested_by,
        proposed_changes=json.dumps(changes_payload),
        previous_lifecycle_status=fdr.lifecycle_status or LifecycleState.ACTIVE.value
    )

    fdr.lifecycle_status = LifecycleState.REPLACEMENT_PENDING.value
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    logger.info(f"Replacement workflow {wf_id} initiated for FDR {fdr.reference} -> {req.new_reference}.")
    return _to_workflow_out(workflow)

def initiate_release(db: Session, fdr_id: str, req: ReleaseInitiateRequest) -> WorkflowItemOut:
    """
    Initiates an administrative deposit release/refund request.
    Requires subsequent explicit bureau approval before lien is discharged.
    """
    fdr = _get_fdr_or_404(db, fdr_id)
    _ensure_no_active_workflow(fdr)

    wf_id = f"WF-REL-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    changes_payload = {
        "releaseOrderNumber": req.release_order_number,
        "orderDate": str(req.order_date or date.today()),
        "settlementAccountDetails": req.settlement_account_details,
        "supportingDocumentRef": req.supporting_document_ref,
        "depositAmount": float(fdr.deposit_amount),
        "notes": req.notes
    }

    workflow = FDRWorkflow(
        id=wf_id,
        fdr_id=fdr.id,
        workflow_type=WorkflowType.RELEASE.value,
        status=WorkflowStatus.PENDING.value,
        reason=req.reason,
        request_date=date.today(),
        requested_by=req.requested_by,
        proposed_changes=json.dumps(changes_payload),
        previous_lifecycle_status=fdr.lifecycle_status or LifecycleState.ACTIVE.value
    )

    fdr.lifecycle_status = LifecycleState.RELEASE_REQUESTED.value
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    logger.info(f"Release workflow {wf_id} requested for FDR {fdr.reference} under order {req.release_order_number}.")
    return _to_workflow_out(workflow)

def process_workflow_decision(db: Session, workflow_id: str, decision_req: WorkflowDecisionRequest) -> WorkflowItemOut:
    """
    Applies an explicit human decision (APPROVED or REJECTED) on a pending workflow.
    Executes database transactions atomically to maintain consistency.
    """
    workflow = db.scalar(select(FDRWorkflow).where(FDRWorkflow.id == workflow_id))
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow request '{workflow_id}' not found."
        )

    if workflow.status != WorkflowStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow request '{workflow_id}' has already been decided ({workflow.status})."
        )

    fdr = _get_fdr_or_404(db, workflow.fdr_id)
    now = datetime.now(timezone.utc)
    changes = _parse_proposed_changes(workflow.proposed_changes)

    try:
        if decision_req.decision == WorkflowStatus.APPROVED:
            if workflow.workflow_type == WorkflowType.RENEWAL.value:
                # Apply renewal changes
                new_maturity_str = changes.get("proposedMaturityDate")
                if new_maturity_str:
                    fdr.maturity_date = date.fromisoformat(new_maturity_str)
                if changes.get("proposedInterestRate"):
                    fdr.interest_rate = changes["proposedInterestRate"]
                if changes.get("renewalCertificateNo"):
                    fdr.certificate_no = changes["renewalCertificateNo"]

                fdr.verification_status = "Verified"
                fdr.lifecycle_status = LifecycleState.ACTIVE.value
                fdr.discrepancy_note = None

            elif workflow.workflow_type == WorkflowType.REPLACEMENT.value:
                # Apply replacement changes while preserving historical integrity
                new_ref = changes.get("newReference")
                if new_ref:
                    # Final check for duplicate active references
                    existing = db.scalar(
                        select(FDR).where(FDR.reference == new_ref, FDR.id != fdr.id)
                    )
                    if existing:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Cannot approve replacement: reference '{new_ref}' was claimed by another instrument."
                        )
                    fdr.reference = new_ref

                if changes.get("newCertificateNo"):
                    fdr.certificate_no = changes["newCertificateNo"]
                if changes.get("newBankName"):
                    fdr.bank_name = changes["newBankName"]
                if changes.get("newBranch"):
                    fdr.branch = changes["newBranch"]
                if changes.get("newIfsc"):
                    fdr.ifsc = changes["newIfsc"]

                fdr.verification_status = "Verified"
                fdr.lifecycle_status = LifecycleState.ACTIVE.value
                fdr.discrepancy_note = f"Replaced on {date.today().isoformat()} under workflow {workflow.id}."

            elif workflow.workflow_type == WorkflowType.RELEASE.value:
                # Apply formal release
                fdr.lifecycle_status = LifecycleState.RELEASED.value
                fdr.lien_status = f"Lien Released - Bureau Order {changes.get('releaseOrderNumber', 'N/A')}"
                fdr.verification_status = "Verified"

            workflow.status = WorkflowStatus.APPROVED.value

        elif decision_req.decision == WorkflowStatus.REJECTED:
            # Revert FDR lifecycle status to previous state
            fdr.lifecycle_status = workflow.previous_lifecycle_status or LifecycleState.ACTIVE.value
            workflow.status = WorkflowStatus.REJECTED.value

        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid decision '{decision_req.decision}'. Allowed: APPROVED, REJECTED."
            )

        workflow.decision_date = now
        workflow.decided_by = decision_req.decided_by
        workflow.decision_notes = decision_req.decision_notes

        db.commit()
        db.refresh(workflow)
        db.refresh(fdr)

        logger.info(f"Workflow {workflow.id} ({workflow.workflow_type}) marked {workflow.status} by {decision_req.decided_by}.")
        return _to_workflow_out(workflow)

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to process workflow decision {workflow_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow transaction failed: {str(exc)}"
        )

def get_fdr_lifecycle_overview(db: Session, fdr_id: str) -> FDRLifecycleOverview:
    """
    Returns the comprehensive lifecycle state, active workflow, workflow history,
    and available valid next actions for an FDR instrument.
    """
    fdr = _get_fdr_or_404(db, fdr_id)
    workflows = list(
        db.scalars(
            select(FDRWorkflow)
            .where(FDRWorkflow.fdr_id == fdr_id)
            .order_by(desc(FDRWorkflow.created_at))
        ).all()
    )

    history = [_to_workflow_out(w) for w in workflows]
    active_wf = next((h for h in history if h.status == WorkflowStatus.PENDING.value), None)

    # Determine permissible next actions
    curr_status = fdr.lifecycle_status or LifecycleState.ACTIVE.value
    available_actions = []

    if curr_status == LifecycleState.ACTIVE.value:
        available_actions = [
            "INITIATE_RENEWAL",
            "INITIATE_REPLACEMENT",
            "INITIATE_RELEASE"
        ]
    elif curr_status in (
        LifecycleState.RENEWAL_PENDING.value,
        LifecycleState.REPLACEMENT_PENDING.value,
        LifecycleState.RELEASE_REQUESTED.value
    ):
        available_actions = [
            "APPROVE_WORKFLOW",
            "REJECT_WORKFLOW"
        ]
    elif curr_status == LifecycleState.RELEASED.value:
        available_actions = []

    institution_name = fdr.institution.name if fdr.institution else "Unknown Institution"

    return FDRLifecycleOverview(
        fdr_id=fdr.id,
        reference=fdr.reference,
        institution_name=institution_name,
        deposit_amount=float(fdr.deposit_amount),
        current_maturity_date=fdr.maturity_date,
        lifecycle_status=LifecycleState(curr_status) if curr_status in LifecycleState.__members__ else LifecycleState.ACTIVE,
        active_workflow=active_wf,
        available_actions=available_actions,
        workflow_history=history
    )

def get_workflow_summary(db: Session) -> WorkflowBatchSummary:
    """
    Aggregates lifecycle statistics, pending counts, and recent audit logs across all workflows.
    """
    workflows = list(
        db.scalars(
            select(FDRWorkflow)
            .order_by(desc(FDRWorkflow.created_at))
            .limit(50)
        ).all()
    )

    total = db.scalar(select(func.count(FDRWorkflow.id))) or 0
    pending = db.scalar(select(func.count(FDRWorkflow.id)).where(FDRWorkflow.status == WorkflowStatus.PENDING.value)) or 0
    approved = db.scalar(select(func.count(FDRWorkflow.id)).where(FDRWorkflow.status == WorkflowStatus.APPROVED.value)) or 0
    rejected = db.scalar(select(func.count(FDRWorkflow.id)).where(FDRWorkflow.status == WorkflowStatus.REJECTED.value)) or 0

    # Lifecycle status distribution of all FDRs
    fdrs = list(db.scalars(select(FDR)).all())
    breakdown: dict[str, int] = {}
    for f in fdrs:
        st = f.lifecycle_status or LifecycleState.ACTIVE.value
        breakdown[st] = breakdown.get(st, 0) + 1

    return WorkflowBatchSummary(
        total_workflows=total,
        pending_count=pending,
        approved_count=approved,
        rejected_count=rejected,
        lifecycle_breakdown=breakdown,
        recent_workflows=[_to_workflow_out(w) for w in workflows]
    )
