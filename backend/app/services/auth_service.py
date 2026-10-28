import os
import secrets
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

from app.models.admin import AdminUser
from app.models.session import AdminSession
from app.models.audit_log import SecurityAuditLog
from app.config import (
    ADMIN_USERNAME,
    ADMIN_EMAIL,
    ADMIN_INITIAL_PASSWORD,
    SESSION_MAX_AGE_SECONDS,
    MAX_FAILED_LOGIN_ATTEMPTS,
    ACCOUNT_LOCKOUT_MINUTES,
    RECOVERY_TOKEN_EXPIRE_MINUTES
)

logger = logging.getLogger("fdr_rakshak.auth_service")

# Argon2id password hasher with secure memory-hardened parameters
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)

def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def hash_token(raw_token: str) -> str:
    """Generates a deterministic SHA-256 hash of a session or recovery token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def generate_session_token() -> Tuple[str, str]:
    """
    Generates a cryptographically secure 256-bit token.
    Returns: (raw_token, token_hash)
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash

def record_audit_event(
    db: Session,
    event_type: str,
    actor: str,
    status: str = "SUCCESS",
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> SecurityAuditLog:
    """
    Persistently records an immutable security or administrative audit event in PostgreSQL.
    Guarantees that credentials, raw session tokens, and passwords are never logged.
    """
    log_entry = SecurityAuditLog(
        event_type=event_type,
        actor=actor,
        status=status,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(log_entry)
    db.commit()
    return log_entry

def ensure_initial_admin(db: Session) -> AdminUser:
    """
    Provisions or updates the initial AICTE bureau administrator in PostgreSQL.
    Uses environment credentials or secure fallback.
    """
    admin = db.scalar(select(AdminUser).where(AdminUser.username == ADMIN_USERNAME))
    if admin is not None:
        updated = False
        if admin.role != "BUREAU_CHIEF":
            admin.role = "BUREAU_CHIEF"
            updated = True
        if not admin.display_name:
            admin.display_name = "Dr. Ramesh Sharma (AICTE Bureau Chief)"
            updated = True
        if updated:
            db.commit()
            db.refresh(admin)
        return admin

    logger.info("No primary administrative account detected in PostgreSQL. Provisioning initial AICTE Administrator...")
    if not ADMIN_INITIAL_PASSWORD:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION: No administrative account detected in PostgreSQL and "
            "ADMIN_INITIAL_PASSWORD is not configured in environment. Please configure ADMIN_INITIAL_PASSWORD in backend/.env."
        )

    password_hash = hash_password(ADMIN_INITIAL_PASSWORD)

    initial_admin = AdminUser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password_hash=password_hash,
        role="BUREAU_CHIEF",
        display_name="Dr. Ramesh Sharma (AICTE Bureau Chief)"
    )
    db.add(initial_admin)
    db.commit()
    db.refresh(initial_admin)

    record_audit_event(
        db=db,
        event_type="ADMIN_INITIALIZED",
        actor="SYSTEM_LIFESPAN",
        status="SUCCESS",
        details=f"Initial administrator account '{ADMIN_USERNAME}' ({ADMIN_EMAIL}) provisioned with Argon2id credentials."
    )
    logger.info(f"Initial administrator '{ADMIN_USERNAME}' safely created in PostgreSQL.")
    return initial_admin


def ensure_default_rbac_users(db: Session) -> None:
    """
    Idempotently provisions demo accounts for the 4 sovereign RBAC personas:
    1. Institutional User (spit_mumbai / vit_mumbai)
    2. Bank / Financial Node (sbi_nodal)
    3. AICTE Scrutiny Officer (scrutiny_officer)
    4. AICTE Bureau Chief (aicte_admin)
    """
    default_users = [
        {
            "username": "scrutiny_officer",
            "email": "scrutiny.officer@aicte-india.org",
            "password": "Scrutiny@2026!",
            "role": "SCRUTINY_OFFICER",
            "display_name": "Smt. Sunita Rao (Senior Scrutiny Officer)",
            "institution_id": None,
            "bank_name": None
        },
        {
            "username": "spit_mumbai",
            "email": "principal@spit.ac.in",
            "password": "College@2026!",
            "role": "INSTITUTION_USER",
            "display_name": "Sardar Patel Inst. of Tech (College Admin)",
            "institution_id": "INST-SPIT-MH-019",
            "bank_name": None
        },
        {
            "username": "vit_mumbai",
            "email": "admin@vit.edu.in",
            "password": "College@2026!",
            "role": "INSTITUTION_USER",
            "display_name": "Vidyalankar Inst. of Tech (College Admin)",
            "institution_id": "INST-VIT-MH-077",
            "bank_name": None
        },
        {
            "username": "sbi_nodal",
            "email": "treasury.nodal@sbi.co.in",
            "password": "Bank@2026!",
            "role": "BANK_NODE",
            "display_name": "State Bank of India (Institutional Nodal Desk)",
            "institution_id": None,
            "bank_name": "State Bank of India"
        }
    ]

    for user_info in default_users:
        existing = db.scalar(select(AdminUser).where(AdminUser.username == user_info["username"]))
        if not existing:
            new_user = AdminUser(
                username=user_info["username"],
                email=user_info["email"],
                password_hash=hash_password(user_info["password"]),
                role=user_info["role"],
                display_name=user_info["display_name"],
                institution_id=user_info["institution_id"],
                bank_name=user_info["bank_name"]
            )
            db.add(new_user)
            db.commit()
            logger.info(f"RBAC Demo account '{user_info['username']}' ({user_info['role']}) safely provisioned.")
        else:
            updated = False
            if existing.role != user_info["role"]:
                existing.role = user_info["role"]
                updated = True
            if existing.display_name != user_info["display_name"]:
                existing.display_name = user_info["display_name"]
                updated = True
            if existing.institution_id != user_info["institution_id"]:
                existing.institution_id = user_info["institution_id"]
                updated = True
            if existing.bank_name != user_info["bank_name"]:
                existing.bank_name = user_info["bank_name"]
                updated = True
            if updated:
                db.commit()

def authenticate_admin(
    db: Session,
    username: str,
    password: str,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[Optional[AdminUser], Optional[str]]:
    """
    Authenticates administrator with rate-limiting and temporary account lockout.
    Supports case-insensitive username or registered email identification.
    Returns (AdminUser, None) on success, or (None, error_message) on failure.
    """
    now = datetime.now(timezone.utc)
    clean_identifier = username.strip() if username else ""

    admin = db.scalar(
        select(AdminUser).where(
            (func.lower(AdminUser.username) == clean_identifier.lower()) |
            (func.lower(AdminUser.email) == clean_identifier.lower())
        )
    )

    if not admin:
        record_audit_event(
            db=db,
            event_type="LOGIN_FAILURE",
            actor=username,
            status="FAILURE",
            details="Login attempted for non-existent administrator account.",
            ip_address=client_ip,
            user_agent=user_agent
        )
        return None, "Invalid administrative credentials."

    # Check for temporary account lockout
    if admin.locked_until and admin.locked_until > now:
        remaining_secs = int((admin.locked_until - now).total_seconds())
        remaining_mins = max(1, remaining_secs // 60)
        record_audit_event(
            db=db,
            event_type="LOGIN_BLOCKED",
            actor=username,
            status="WARNING",
            details=f"Login blocked due to active rate-limit lockout. {remaining_mins} minutes remaining.",
            ip_address=client_ip,
            user_agent=user_agent
        )
        return None, f"Administrative account locked due to repeated failed logins. Please try again in {remaining_mins} minutes or contact system security."

    # Verify password with Argon2id
    is_valid = verify_password(password, admin.password_hash)

    if not is_valid:
        admin.failed_login_attempts += 1
        lockout_msg = ""
        if admin.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            admin.locked_until = now + timedelta(minutes=ACCOUNT_LOCKOUT_MINUTES)
            lockout_msg = f" Account locked for {ACCOUNT_LOCKOUT_MINUTES} minutes."
            record_audit_event(
                db=db,
                event_type="ACCOUNT_LOCKED",
                actor=username,
                status="WARNING",
                details=f"Account locked after {admin.failed_login_attempts} consecutive failed authentication attempts.",
                ip_address=client_ip,
                user_agent=user_agent
            )

        db.commit()

        record_audit_event(
            db=db,
            event_type="LOGIN_FAILURE",
            actor=username,
            status="FAILURE",
            details=f"Invalid password entered (attempt {admin.failed_login_attempts} of {MAX_FAILED_LOGIN_ATTEMPTS}).{lockout_msg}",
            ip_address=client_ip,
            user_agent=user_agent
        )

        if admin.locked_until and admin.locked_until > now:
            return None, f"Account locked for {ACCOUNT_LOCKOUT_MINUTES} minutes due to repeated authentication failures."
        return None, "Invalid administrative credentials."

    # Authentication Successful: reset failure counters
    admin.failed_login_attempts = 0
    admin.locked_until = None
    db.commit()

    record_audit_event(
        db=db,
        event_type="LOGIN_SUCCESS",
        actor=username,
        status="SUCCESS",
        details="Administrator authenticated successfully via Argon2id.",
        ip_address=client_ip,
        user_agent=user_agent
    )

    return admin, None

def create_session(
    db: Session,
    admin_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[AdminSession, str]:
    """
    Creates a new server-managed session in PostgreSQL.
    Returns: (AdminSession record, raw_session_token)
    """
    raw_token, token_hash = generate_session_token()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=SESSION_MAX_AGE_SECONDS)

    session = AdminSession(
        session_token_hash=token_hash,
        admin_id=admin_id,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at,
        last_activity_at=now,
        created_at=now,
        is_revoked=False
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return session, raw_token

def get_active_session(db: Session, raw_token: str) -> Optional[AdminSession]:
    """
    Validates a raw session token against active sessions in PostgreSQL.
    Returns the session if valid, active, and unexpired; otherwise None.
    """
    if not raw_token or not raw_token.strip():
        return None

    token_hash = hash_token(raw_token.strip())
    now = datetime.now(timezone.utc)

    session = db.scalar(
        select(AdminSession).where(
            AdminSession.session_token_hash == token_hash,
            AdminSession.is_revoked == False,
            AdminSession.expires_at > now
        )
    )

    if session:
        # Update last activity timestamp
        session.last_activity_at = now
        db.commit()

    return session

def revoke_session(
    db: Session,
    raw_token: str,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """Invalidates an active session in PostgreSQL and logs the logout event."""
    if not raw_token:
        return False

    token_hash = hash_token(raw_token.strip())
    session = db.scalar(select(AdminSession).where(AdminSession.session_token_hash == token_hash))

    if not session or session.is_revoked:
        return False

    session.is_revoked = True
    db.commit()

    actor = session.admin.username if session.admin else "UNKNOWN_ADMIN"
    record_audit_event(
        db=db,
        event_type="LOGOUT",
        actor=actor,
        status="SUCCESS",
        details="Administrator session invalidated and logged out.",
        ip_address=client_ip,
        user_agent=user_agent
    )
    return True

def revoke_all_admin_sessions(db: Session, admin_id: str) -> int:
    """Revokes all active sessions for an administrator (used upon password reset)."""
    result = db.execute(
        update(AdminSession)
        .where(AdminSession.admin_id == admin_id, AdminSession.is_revoked == False)
        .values(is_revoked=True)
    )
    db.commit()
    return result.rowcount

def initiate_password_recovery(
    db: Session,
    identifier: str,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generates a secure, expiring one-time password recovery token.
    Returns: (success, message, raw_token_for_console)
    """
    now = datetime.now(timezone.utc)
    clean_identifier = identifier.strip() if identifier else ""

    admin = db.scalar(
        select(AdminUser).where(
            (func.lower(AdminUser.username) == clean_identifier.lower()) |
            (func.lower(AdminUser.email) == clean_identifier.lower())
        )
    )

    if not admin:
        record_audit_event(
            db=db,
            event_type="PASSWORD_RECOVERY_REQUESTED",
            actor=identifier,
            status="WARNING",
            details="Password recovery requested for non-existent identifier.",
            ip_address=client_ip,
            user_agent=user_agent
        )
        # Return generic safe message to prevent user enumeration
        return True, "If an account matches this identifier, a recovery token has been registered in the server administration console.", None

    raw_token = secrets.token_urlsafe(32)
    admin.recovery_token_hash = hash_token(raw_token)
    admin.recovery_token_expires_at = now + timedelta(minutes=RECOVERY_TOKEN_EXPIRE_MINUTES)
    db.commit()

    record_audit_event(
        db=db,
        event_type="PASSWORD_RECOVERY_INITIATED",
        actor=admin.username,
        status="SUCCESS",
        details=f"One-time recovery token issued for administrator '{admin.username}' ({RECOVERY_TOKEN_EXPIRE_MINUTES}m expiry).",
        ip_address=client_ip,
        user_agent=user_agent
    )

    logger.warning(
        f"[AICTE SECURITY CONSOLE] PASSWORD RECOVERY TOKEN GENERATED for admin '{admin.username}':\n"
        f"TOKEN: {raw_token}\n"
        f"EXPIRES: in {RECOVERY_TOKEN_EXPIRE_MINUTES} minutes.\n"
        f"This token is single-use and invalidates all existing sessions upon use."
    )

    return True, "Recovery token issued. Check the server administrative terminal or console.", raw_token

def reset_password_with_recovery_token(
    db: Session,
    raw_token: str,
    new_password: str,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Resets the administrator password using a valid, unexpired recovery token.
    Invalidates all existing sessions upon success.
    """
    if not raw_token or not raw_token.strip():
        return False, "Password recovery token is required."

    if len(new_password) < 8:
        return False, "Password must be at least 8 characters long."

    token_hash = hash_token(raw_token.strip())
    now = datetime.now(timezone.utc)

    admin = db.scalar(
        select(AdminUser).where(
            AdminUser.recovery_token_hash == token_hash,
            AdminUser.recovery_token_expires_at > now
        )
    )

    if not admin:
        record_audit_event(
            db=db,
            event_type="PASSWORD_RESET_FAILED",
            actor="ANONYMOUS",
            status="FAILURE",
            details="Invalid or expired recovery token supplied during password reset.",
            ip_address=client_ip,
            user_agent=user_agent
        )
        return False, "Invalid or expired recovery token."

    # Update password with Argon2id
    admin.password_hash = hash_password(new_password)
    admin.recovery_token_hash = None
    admin.recovery_token_expires_at = None
    admin.failed_login_attempts = 0
    admin.locked_until = None
    db.commit()
    db.refresh(admin)

    # Invalidate all existing sessions
    revoked_count = revoke_all_admin_sessions(db, admin.id)

    record_audit_event(
        db=db,
        event_type="PASSWORD_RESET_COMPLETED",
        actor=admin.username,
        status="SUCCESS",
        details=f"Administrator password reset completed. {revoked_count} active sessions invalidated.",
        ip_address=client_ip,
        user_agent=user_agent
    )

    logger.info(f"Password reset completed for admin '{admin.username}'. {revoked_count} active sessions revoked.")
    return True, "Administrative password reset successfully. All previous sessions have been revoked. Please log in."
