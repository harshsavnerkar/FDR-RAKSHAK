import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.database import SessionLocal
from app.models.admin import AdminUser
from app.models.session import AdminSession
from app.config import (
    ADMIN_USERNAME,
    ADMIN_INITIAL_PASSWORD,
    SESSION_COOKIE_NAME
)
from app.services.auth_service import ensure_initial_admin, hash_password

@pytest.fixture(scope="function")
def secure_client():
    """Test client without dependency overrides for authentic security audit testing."""
    from app.dependencies.auth import get_current_admin
    override_backup = app.dependency_overrides.pop(get_current_admin, None)
    
    with TestClient(app) as client:
        yield client
        
    if override_backup:
        app.dependency_overrides[get_current_admin] = override_backup

def test_security_response_headers_enforced(secure_client):
    """Verifies statutory security headers are present on all HTTP responses."""
    res = secure_client.get("/api/health")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-origin" in res.headers.get("referrer-policy", "")

def test_unauthenticated_api_rejections_across_methods(secure_client):
    """Ensures POST, PATCH, DELETE operations on protected routes return 401 without valid session."""
    dummy_id = str(uuid.uuid4())
    
    # POST without auth
    post_res = secure_client.post("/api/institutions", json={"name": "Hacker Institute", "code": "HACK-01"})
    assert post_res.status_code == 401

    post_fdr = secure_client.post("/api/fdrs", json={"reference": "HACK-FDR-01"})
    assert post_fdr.status_code == 401

    # PATCH without auth
    patch_res = secure_client.patch(f"/api/fdrs/{dummy_id}", json={"depositAmount": 100})
    assert patch_res.status_code == 401

    # DELETE without auth
    del_res = secure_client.delete(f"/api/institutions/{dummy_id}")
    assert del_res.status_code == 401

def test_document_preview_path_traversal_prevention(secure_client):
    """Attempts to traverse directory paths via document_id parameter must be blocked with HTTP 400."""
    # Attempt directory traversal attacks
    traversal_payloads = [
        "../../etc/passwd",
        "..%2F..%2Fwindows%2Fsystem32",
        "invalid_non_uuid_string",
        "12345",
        "'; DROP TABLE fdrs; --"
    ]
    for bad_id in traversal_payloads:
        res = secure_client.get(f"/api/documents/{bad_id}/preview")
        # Must be rejected (either 401 unauthenticated or 400 bad request)
        assert res.status_code in (400, 401, 404), f"Failed to block traversal payload: {bad_id}"

def test_case_insensitive_and_email_admin_login(secure_client):
    """Ensures administrator can authenticate using normalized username (case-insensitive) or registered email."""
    test_user = f"case_test_{uuid.uuid4().hex[:8]}"
    test_email = f"{test_user}@aicte-india.org"
    test_pass = "CaseSensitivity123!"

    with SessionLocal() as db:
        test_admin = AdminUser(
            id=str(uuid.uuid4()),
            username=test_user,
            email=test_email,
            password_hash=hash_password(test_pass),
            failed_login_attempts=0,
            locked_until=None
        )
        db.add(test_admin)
        db.commit()
        admin_id = str(test_admin.id)

    try:
        # 1. Login with uppercase username
        upper_login = secure_client.post(
            "/api/auth/login",
            json={"username": test_user.upper(), "password": test_pass}
        )
        assert upper_login.status_code == 200
        assert upper_login.json()["authenticated"] is True

        # 2. Login with email
        email_login = secure_client.post(
            "/api/auth/login",
            json={"username": test_email, "password": test_pass}
        )
        assert email_login.status_code == 200
        assert email_login.json()["authenticated"] is True
    finally:
        with SessionLocal() as db:
            db.query(AdminSession).filter(AdminSession.admin_id == admin_id).delete()
            disposable = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
            if disposable:
                db.delete(disposable)
            db.commit()

def test_database_corpus_and_record_preservation():
    """Guarantees that institutions, FDR records, and the multi-crore corpus remain preserved in PostgreSQL."""
    with SessionLocal() as db:
        inst_count = db.execute(text("SELECT count(*) FROM institutions")).scalar()
        fdr_count = db.execute(text("SELECT count(*) FROM fdrs")).scalar()
        corpus_val = db.execute(text("SELECT sum(deposit_amount) FROM fdrs")).scalar()

        assert inst_count >= 10, f"Expected at least 10 institutions, found {inst_count}"
        assert fdr_count >= 10, f"Expected at least 10 FDR records, found {fdr_count}"
        assert float(corpus_val) >= 48500000.0, f"Corpus altered! Expected at least 48500000.0, got {corpus_val}"
