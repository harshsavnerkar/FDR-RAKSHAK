import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.admin import AdminUser
from app.services.auth_service import verify_password

client = TestClient(app)

def test_rbac_login_all_four_roles():
    """Verify all 4 sovereign RBAC personas can successfully authenticate and return role metadata."""
    # Determine current admin password in active database
    db = SessionLocal()
    admin_user = db.query(AdminUser).filter_by(username="aicte_admin").first()
    admin_pass = "Admin@123" if (admin_user and verify_password("Admin@123", admin_user.password_hash)) else "AICTE@Admin2026!"
    db.close()

    roles_and_creds = [
        ("aicte_admin", admin_pass, "BUREAU_CHIEF"),
        ("scrutiny_officer", "Scrutiny@2026!", "SCRUTINY_OFFICER"),
        ("spit_mumbai", "College@2026!", "INSTITUTION_USER"),
        ("sbi_nodal", "Bank@2026!", "BANK_NODE")
    ]

    for username, password, expected_role in roles_and_creds:
        res = client.post("/api/auth/login", json={"username": username, "password": password})
        assert res.status_code == 200, f"Login failed for {username}: {res.text}"
        data = res.json()
        assert data["authenticated"] is True
        assert data["role"] == expected_role
        assert "admin" in data
        assert data["admin"]["role"] == expected_role

def test_institutional_user_tenant_isolation():
    """Verify Institutional User is strictly isolated to their own institution and FDRs."""
    c = TestClient(app)
    # Login as SPIT Mumbai
    login_res = c.post("/api/auth/login", json={"username": "spit_mumbai", "password": "College@2026!"})
    assert login_res.status_code == 200

    # 1. Fetching institutions must return only SPIT
    inst_res = c.get("/api/institutions")
    assert inst_res.status_code == 200
    inst_list = inst_res.json()
    assert len(inst_list) == 1
    assert inst_list[0]["id"] == "INST-SPIT-MH-019"

    # 2. Fetching all FDRs must return only SPIT's FDRs
    fdr_res = c.get("/api/fdrs")
    assert fdr_res.status_code == 200
    fdr_list = fdr_res.json()
    assert len(fdr_list) > 0
    for fdr in fdr_list:
        assert fdr["institutionId"] == "INST-SPIT-MH-019"

    # 3. Accessing another institution's FDR dossier directly must return 403 Forbidden
    # FDR-2024-8831 belongs to INST-VIT-MH-077
    forbidden_res = c.get("/api/fdrs/FDR-2024-8831")
    assert forbidden_res.status_code == 403

    # 4. Attempting to delete an FDR must return 403 Forbidden
    del_res = c.delete("/api/fdrs/FDR-2024-9102")
    assert del_res.status_code == 403

def test_bank_node_partner_isolation():
    """Verify Bank Node is strictly scoped to their partner bank's instruments."""
    c = TestClient(app)
    # Login as SBI Nodal Desk
    login_res = c.post("/api/auth/login", json={"username": "sbi_nodal", "password": "Bank@2026!"})
    assert login_res.status_code == 200

    # Fetching FDRs must only return instruments where bank_name == 'State Bank of India'
    fdr_res = c.get("/api/fdrs")
    assert fdr_res.status_code == 200
    fdr_list = fdr_res.json()
    assert len(fdr_list) > 0
    for fdr in fdr_list:
        assert fdr["bankName"] == "State Bank of India"

    # Direct access to a non-SBI FDR must return 403 Forbidden
    # Find a non-SBI FDR ID from a fresh unauthenticated client
    fresh_client = TestClient(app)
    non_sbi_fdr = next(f for f in fresh_client.get("/api/fdrs").json() if f["bankName"] != "State Bank of India")
    res_direct = c.get(f"/api/fdrs/{non_sbi_fdr['id']}")
    assert res_direct.status_code == 403

def test_maker_checker_enforcement_scrutiny_officer():
    """Verify Scrutiny Officer (Maker) cannot authorize (Check/Approve) workflow releases."""
    c = TestClient(app)
    # Login as Scrutiny Officer
    login_res = c.post("/api/auth/login", json={"username": "scrutiny_officer", "password": "Scrutiny@2026!"})
    assert login_res.status_code == 200

    # Scrutiny officer can view all FDRs
    fdr_res = c.get("/api/fdrs")
    assert fdr_res.status_code == 200
    assert len(fdr_res.json()) >= 10

    # First, let's create a pending workflow or use an existing one
    # If we attempt to decide/approve with Scrutiny Officer:
    # Get summary
    summary = c.get("/api/workflows/summary").json()
    pending = [w for w in summary["recentWorkflows"] if w["status"] == "PENDING"]
    
    if not pending:
        # Initiate a test release on an active FDR
        init_res = c.post("/api/workflows/fdr/FDR-2024-9102/release", json={
            "reason": "Maker-checker test compliance release verification",
            "releaseOrderNumber": "RO-AICTE-RBAC-001"
        })
        assert init_res.status_code in (201, 400)
        summary = c.get("/api/workflows/summary").json()
        pending = [w for w in summary["recentWorkflows"] if w["status"] == "PENDING"]

    if pending:
        wf_id = pending[0]["id"]
        # Scrutiny Officer attempts to approve -> Must be rejected with 403 Maker-Checker violation
        decide_res = c.post(f"/api/workflows/{wf_id}/decide", json={
            "decision": "APPROVED",
            "decisionNotes": "Scrutiny officer attempting unauthorized release authorization"
        })
        assert decide_res.status_code == 403
        assert "Maker-Checker" in decide_res.json()["detail"]
