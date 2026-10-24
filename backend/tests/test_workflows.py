from datetime import date, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.workflow import LifecycleState, WorkflowType, WorkflowStatus

client = TestClient(app)

@pytest.fixture
def test_fdr():
    db = SessionLocal()
    try:
        # Create unique test FDR
        fdr_id = "TEST-WF-FDR-01"
        existing = db.get(FDR, fdr_id)
        if existing:
            db.delete(existing)
            db.commit()

        # Check institution
        inst = db.get(Institution, "INST-DITE-DL-004")
        if not inst:
            inst = Institution(id="INST-DITE-DL-004", code="DITE-DL-004", name="Delhi Tech")
            db.add(inst)
            db.commit()

        fdr = FDR(
            id=fdr_id,
            reference="FDR-AICTE-TEST-WF-01",
            institution_id="INST-DITE-DL-004",
            bank_name="State Bank of India",
            branch="Parliament Street",
            ifsc="SBIN0000691",
            certificate_no="CERT-WF-001",
            deposit_amount=Decimal("1500000.00"),
            currency="INR",
            issue_date=date(2023, 1, 1),
            maturity_date=date(2026, 11, 1),
            verification_status="Verified",
            priority="Standard",
            lifecycle_status=LifecycleState.ACTIVE.value
        )
        db.add(fdr)
        db.commit()
        yield fdr_id
    finally:
        fdr = db.get(FDR, fdr_id)
        if fdr:
            db.delete(fdr)
            db.commit()
        db.close()

def test_workflow_summary_api():
    res = client.get("/api/workflows/summary")
    assert res.status_code == 200
    data = res.json()
    assert "totalWorkflows" in data
    assert "pendingCount" in data
    assert "lifecycleBreakdown" in data
    assert "disclaimer" in data

def test_fdr_lifecycle_overview_api(test_fdr):
    res = client.get(f"/api/workflows/fdr/{test_fdr}")
    assert res.status_code == 200
    data = res.json()
    assert data["fdrId"] == test_fdr
    assert data["lifecycleStatus"] == "ACTIVE"
    assert "INITIATE_RENEWAL" in data["availableActions"]
    assert "INITIATE_REPLACEMENT" in data["availableActions"]
    assert "INITIATE_RELEASE" in data["availableActions"]

def test_renewal_workflow_lifecycle(test_fdr):
    # 1. Validation failure: past date
    res_bad = client.post(
        f"/api/workflows/fdr/{test_fdr}/renew",
        json={
            "reason": "Test renewal with invalid past date",
            "proposedMaturityDate": str(date.today() - timedelta(days=5))
        }
    )
    assert res_bad.status_code == 422

    # 2. Initiate valid renewal
    future_date = date.today() + timedelta(days=730)
    res_init = client.post(
        f"/api/workflows/fdr/{test_fdr}/renew",
        json={
            "reason": "Statutory 3-year AICTE lien extension approved by governing council",
            "proposedMaturityDate": str(future_date),
            "proposedInterestRate": "7.25% p.a.",
            "renewalCertificateNo": "CERT-REN-2026-99"
        }
    )
    assert res_init.status_code == 201
    wf = res_init.json()
    wf_id = wf["id"]
    assert wf["status"] == "PENDING"
    assert wf["workflowType"] == "RENEWAL"

    # 3. FDR state must now be RENEWAL_PENDING
    overview = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert overview["lifecycleStatus"] == "RENEWAL_PENDING"
    assert "APPROVE_WORKFLOW" in overview["availableActions"]
    assert "REJECT_WORKFLOW" in overview["availableActions"]

    # 4. Conflict: Cannot initiate second workflow while one is pending
    res_conflict = client.post(
        f"/api/workflows/fdr/{test_fdr}/renew",
        json={
            "reason": "Duplicate attempt while already pending",
            "proposedMaturityDate": str(future_date)
        }
    )
    assert res_conflict.status_code == 409

    # 5. Approve Renewal
    res_approve = client.post(
        f"/api/workflows/{wf_id}/decide",
        json={
            "decision": "APPROVED",
            "decidedBy": "Dr. Sharma, AICTE Regional Director",
            "decisionNotes": "Original deposit certificate renewed and verified against bank confirmation letter."
        }
    )
    assert res_approve.status_code == 200
    decided_wf = res_approve.json()
    assert decided_wf["status"] == "APPROVED"

    # 6. Verify FDR record was updated with new maturity date and status is ACTIVE
    updated_overview = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert updated_overview["lifecycleStatus"] == "ACTIVE"
    assert updated_overview["currentMaturityDate"] == str(future_date)

    # 7. Check workflow history preserved
    assert len(updated_overview["workflowHistory"]) >= 1
    assert updated_overview["workflowHistory"][0]["id"] == wf_id

def test_replacement_workflow_and_duplicate_prevention(test_fdr):
    # 1. Initiate replacement
    new_unique_ref = f"FDR-AICTE-REPLACED-{date.today().year}-888"
    res_init = client.post(
        f"/api/workflows/fdr/{test_fdr}/replace",
        json={
            "reason": "Original paper certificate mutilated in office transfer; bank re-issued fresh duplicate",
            "newReference": new_unique_ref,
            "newCertificateNo": "CERT-DUP-888",
            "replacementReason": "Damaged original physical instrument"
        }
    )
    assert res_init.status_code == 201
    wf_id = res_init.json()["id"]

    # 2. FDR state must be REPLACEMENT_PENDING
    overview = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert overview["lifecycleStatus"] == "REPLACEMENT_PENDING"

    # 3. Rejection Workflow Test
    res_reject = client.post(
        f"/api/workflows/{wf_id}/decide",
        json={
            "decision": "REJECTED",
            "decidedBy": "Bureau Approving Officer",
            "decisionNotes": "Replacement certificate serial number does not match issuing branch ledger."
        }
    )
    assert res_reject.status_code == 200
    assert res_reject.json()["status"] == "REJECTED"

    # 4. State must revert safely to ACTIVE
    overview_reverted = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert overview_reverted["lifecycleStatus"] == "ACTIVE"

def test_duplicate_active_replacement_reference_prohibited(test_fdr):
    # Try to replace using an existing FDR's reference (e.g. FDR-AICTE-2024-8841)
    res = client.post(
        f"/api/workflows/fdr/{test_fdr}/replace",
        json={
            "reason": "Replacement attempt with duplicate reference",
            "newReference": "FDR-AICTE-2024-8841",
            "newCertificateNo": "CERT-CONFLICT"
        }
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]

def test_release_workflow_lifecycle(test_fdr):
    # 1. Initiate Release Request
    order_ref = "AICTE/BUREAU/REL/2026/089"
    res_init = client.post(
        f"/api/workflows/fdr/{test_fdr}/release",
        json={
            "reason": "Formal institution closure and full statutory compliance certified by Inspection Committee",
            "releaseOrderNumber": order_ref,
            "orderDate": str(date.today()),
            "settlementAccountDetails": "State Bank of India A/C 30981290312"
        }
    )
    assert res_init.status_code == 201
    wf_id = res_init.json()["id"]

    # 2. State must be RELEASE_REQUESTED
    overview = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert overview["lifecycleStatus"] == "RELEASE_REQUESTED"

    # 3. Approve Release
    res_approve = client.post(
        f"/api/workflows/{wf_id}/decide",
        json={
            "decision": "APPROVED",
            "decidedBy": "Member Secretary, AICTE",
            "decisionNotes": "All security deposit refund clearances received from Finance Bureau."
        }
    )
    assert res_approve.status_code == 200

    # 4. State must now be RELEASED
    overview_released = client.get(f"/api/workflows/fdr/{test_fdr}").json()
    assert overview_released["lifecycleStatus"] == "RELEASED"
    assert len(overview_released["availableActions"]) == 0

    # 5. Subsequent actions on RELEASED instrument must be blocked
    res_blocked = client.post(
        f"/api/workflows/fdr/{test_fdr}/renew",
        json={
            "reason": "Attempting renewal on released instrument",
            "proposedMaturityDate": str(date.today() + timedelta(days=365))
        }
    )
    assert res_blocked.status_code == 400
    assert "RELEASED" in res_blocked.json()["detail"]

def test_invalid_workflow_decisions():
    # Nonexistent workflow id
    res_404 = client.post(
        "/api/workflows/NONEXISTENT-WF-999/decide",
        json={
            "decision": "APPROVED",
            "decisionNotes": "Notes"
        }
    )
    assert res_404.status_code == 404
