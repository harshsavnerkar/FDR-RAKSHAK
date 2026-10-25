import pytest
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.database import SessionLocal
from app.models.admin import AdminUser
from app.models.session import AdminSession
from app.models.audit_log import SecurityAuditLog
from app.config import (
    ADMIN_USERNAME,
    ADMIN_INITIAL_PASSWORD,
    SESSION_COOKIE_NAME
)
from app.services.auth_service import ensure_initial_admin, hash_password, hash_token

@pytest.fixture(scope="function")
def unauthenticated_client():
    """Client without dependency overrides for real authentication testing."""
    # Temporarily remove dependency override if set by conftest
    from app.dependencies.auth import get_current_admin
    override_backup = app.dependency_overrides.pop(get_current_admin, None)
    
    with TestClient(app) as client:
        yield client
        
    # Restore override for other test suites
    if override_backup:
        app.dependency_overrides[get_current_admin] = override_backup

def test_public_endpoints_accessible(unauthenticated_client):
    """Health check and root info should be accessible without credentials."""
    health_res = unauthenticated_client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    root_res = unauthenticated_client.get("/")
    assert root_res.status_code == 200
    assert "portal" in root_res.json()

def test_protected_endpoints_require_authentication(unauthenticated_client):
    """Protected domain routes must reject unauthenticated requests with HTTP 401."""
    protected_urls = [
        "/api/institutions",
        "/api/fdrs",
        "/api/dashboard/summary",
        "/api/documents/status",
        "/api/compliance/summary",
        "/api/risk/summary",
        "/api/workflows/summary",
        "/api/audit-logs",
    ]

    for url in protected_urls:
        res = unauthenticated_client.get(url)
        assert res.status_code == 401, f"Expected 401 for {url}, got {res.status_code}"
        assert "Authentication required" in res.json().get("detail", "")

def test_admin_login_and_session_lifecycle(unauthenticated_client):
    """Verifies end-to-end admin login, cookie issuance, authenticated access, and logout."""
    with SessionLocal() as db:
        admin = ensure_initial_admin(db)
        admin.password_hash = hash_password(ADMIN_INITIAL_PASSWORD)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        db.commit()

    # 1. Attempt login with invalid password
    bad_res = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": "WrongMasterPassword123!"}
    )
    assert bad_res.status_code == 401
    assert "Invalid administrative credentials" in bad_res.json()["detail"]

    # 2. Login with valid credentials
    login_res = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_INITIAL_PASSWORD}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["authenticated"] is True
    assert login_data["admin"]["username"] == ADMIN_USERNAME

    # Verify session cookie was set
    assert SESSION_COOKIE_NAME in login_res.cookies
    session_cookie = login_res.cookies[SESSION_COOKIE_NAME]
    assert session_cookie is not None and len(session_cookie) > 20

    # 3. Verify session endpoint using the issued cookie
    session_res = unauthenticated_client.get(
        "/api/auth/session",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert session_res.status_code == 200
    session_data = session_res.json()
    assert session_data["authenticated"] is True
    assert session_data["admin"]["username"] == ADMIN_USERNAME

    # 4. Access protected domain route with session cookie
    fdrs_res = unauthenticated_client.get(
        "/api/fdrs",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert fdrs_res.status_code == 200
    assert len(fdrs_res.json()) >= 10

    # 5. Logout and verify session revocation
    logout_res = unauthenticated_client.post(
        "/api/auth/logout",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["authenticated"] is False

    # 6. Verify subsequent session check returns unauthenticated
    post_logout_res = unauthenticated_client.get(
        "/api/auth/session",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert post_logout_res.status_code == 200
    assert post_logout_res.json()["authenticated"] is False

    # 7. Verify subsequent domain route access returns 401
    post_logout_fdrs = unauthenticated_client.get(
        "/api/fdrs",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert post_logout_fdrs.status_code == 401

def test_account_lockout_after_multiple_failures(unauthenticated_client):
    """Account should temporarily lock out after exceeding max failed login attempts."""
    test_user = "lockout_test_admin"

    with SessionLocal() as db:
        # Create a disposable admin record for lockout testing
        admin = db.query(AdminUser).filter(AdminUser.username == test_user).first()
        if not admin:
            admin = AdminUser(
                id=uuid.uuid4(),
                username=test_user,
                email="lockout@aicte.gov.in",
                password_hash=hash_password("ValidPassword123!")
            )
            db.add(admin)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        db.commit()

    # Trigger 5 failed attempts
    for i in range(4):
        res = unauthenticated_client.post(
            "/api/auth/login",
            json={"username": test_user, "password": "WrongPassword"}
        )
        assert res.status_code == 401

    # 5th failed attempt should trigger lockout
    lock_res = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": test_user, "password": "WrongPassword"}
    )
    assert lock_res.status_code == 401
    assert "locked" in lock_res.json()["detail"].lower()

    # Even with correct password, locked account must be rejected
    locked_attempt = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": test_user, "password": "ValidPassword123!"}
    )
    assert locked_attempt.status_code == 401
    assert "locked" in locked_attempt.json()["detail"].lower()

    # Clean up test admin
    with SessionLocal() as db:
        admin = db.query(AdminUser).filter(AdminUser.username == test_user).first()
        if admin:
            db.delete(admin)
            db.commit()

def test_password_recovery_token_flow(unauthenticated_client):
    """Verifies one-time expiring recovery token initiation, reset, login with new password, and rejection of old password."""
    with SessionLocal() as db:
        admin = ensure_initial_admin(db)
        admin.failed_login_attempts = 3  # simulate prior failed attempts
        admin.locked_until = None
        db.commit()

    # 1. Initiate recovery
    init_res = unauthenticated_client.post(
        "/api/auth/recover-initiate",
        json={"identifier": ADMIN_USERNAME}
    )
    assert init_res.status_code == 200
    init_data = init_res.json()
    assert "recovery token issued" in init_data["message"].lower()

    # In production, token is printed to secure console.
    # For automated testing, set a known test token hash in the database:
    raw_token = "regulatory_test_token_" + secrets.token_urlsafe(16)
    with SessionLocal() as db:
        admin = db.query(AdminUser).filter(AdminUser.username == ADMIN_USERNAME).first()
        admin.recovery_token_hash = hash_token(raw_token)
        admin.recovery_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()

    # 2. Simulate token entry with an invalid token
    bad_reset = unauthenticated_client.post(
        "/api/auth/recover-reset",
        json={"recovery_token": "invalid_bogus_token", "new_password": "NewSecurePassword123!"}
    )
    assert bad_reset.status_code == 400
    assert "invalid or expired" in bad_reset.json()["detail"].lower()

    # 3. Reset password with legitimate recovery token
    new_password = "NewMasterVaultPass2026!#"
    reset_res = unauthenticated_client.post(
        "/api/auth/recover-reset",
        json={"recovery_token": raw_token, "new_password": new_password}
    )
    assert reset_res.status_code == 200
    assert "successfully" in reset_res.json()["message"].lower()

    # 4. Verify DB state: token wiped, failure counters cleared, lockout cleared
    with SessionLocal() as db:
        admin = db.query(AdminUser).filter(AdminUser.username == ADMIN_USERNAME).first()
        assert admin.recovery_token_hash is None
        assert admin.recovery_token_expires_at is None
        assert admin.failed_login_attempts == 0
        assert admin.locked_until is None

    # 5. Old password MUST fail
    old_login = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_INITIAL_PASSWORD}
    )
    assert old_login.status_code == 401
    assert "Invalid administrative credentials" in old_login.json()["detail"]

    # 6. New password MUST succeed
    new_login = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": new_password}
    )
    assert new_login.status_code == 200
    new_login_data = new_login.json()
    assert new_login_data["authenticated"] is True
    assert SESSION_COOKIE_NAME in new_login.cookies
    session_cookie = new_login.cookies[SESSION_COOKIE_NAME]

    # 7. Session check with new session cookie must succeed
    sess_check = unauthenticated_client.get(
        "/api/auth/session",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert sess_check.status_code == 200
    assert sess_check.json()["authenticated"] is True
    assert sess_check.json()["admin"]["username"] == ADMIN_USERNAME

    # 8. Reset password back to canonical ADMIN_INITIAL_PASSWORD for test suite reproducibility
    with SessionLocal() as db:
        admin = db.query(AdminUser).filter(AdminUser.username == ADMIN_USERNAME).first()
        admin.password_hash = hash_password(ADMIN_INITIAL_PASSWORD)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        db.commit()

def test_document_preview_security(unauthenticated_client):
    """Document preview endpoint must reject unauthenticated requests."""
    fake_doc_id = str(uuid.uuid4())
    res = unauthenticated_client.get(f"/api/documents/{fake_doc_id}/preview")
    assert res.status_code == 401

def test_security_audit_logs_endpoint(unauthenticated_client):
    """Security audit logs should be viewable by an authenticated administrator."""
    # 1. Login to get session
    login_res = unauthenticated_client.post(
        "/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_INITIAL_PASSWORD}
    )
    session_cookie = login_res.cookies[SESSION_COOKIE_NAME]

    # 2. Query audit logs
    audit_res = unauthenticated_client.get(
        "/api/audit-logs?limit=20",
        cookies={SESSION_COOKIE_NAME: session_cookie}
    )
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(log["eventType"] == "LOGIN_SUCCESS" or log.get("event_type") == "LOGIN_SUCCESS" for log in data)
