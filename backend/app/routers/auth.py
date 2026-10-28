import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import (
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS,
    SESSION_COOKIE_SECURE,
    SESSION_COOKIE_SAMESITE
)
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SessionResponse,
    PasswordRecoveryInitiateRequest,
    PasswordRecoveryInitiateResponse,
    PasswordRecoveryResetRequest,
    PasswordRecoveryResetResponse
)
from app.services import auth_service
from app.dependencies.auth import get_session_token_from_request

logger = logging.getLogger("fdr_rakshak.auth_router")

router = APIRouter(prefix="/api/auth", tags=["Administrator Authentication & Security"])

def get_client_ip(request: Request) -> str:
    """Extracts client IP considering forwarding headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.post("/login", response_model=LoginResponse)
def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticates the AICTE bureau administrator via Argon2id password verification.
    Enforces rate-limiting and temporary account lockout on repeated failures.
    Issues a server-managed, HTTP-only session cookie upon success.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    admin, err_msg = auth_service.authenticate_admin(
        db=db,
        username=req.username.strip(),
        password=req.password,
        client_ip=client_ip,
        user_agent=user_agent
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=err_msg or "Invalid administrative credentials."
        )

    # Create server session in PostgreSQL
    session_rec, raw_token = auth_service.create_session(
        db=db,
        admin_id=admin.id,
        ip_address=client_ip,
        user_agent=user_agent
    )

    # Set secure HTTP-only session cookie
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=raw_token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
        path="/"
    )

    admin_data = {
        "username": admin.username,
        "email": admin.email,
        "role": admin.role or "BUREAU_CHIEF",
        "displayName": admin.display_name or admin.username,
        "institutionId": admin.institution_id,
        "bankName": admin.bank_name
    }

    return LoginResponse(
        status="success",
        authenticated=True,
        username=admin.username,
        email=admin.email,
        role=admin.role or "BUREAU_CHIEF",
        display_name=admin.display_name or admin.username,
        institution_id=admin.institution_id,
        bank_name=admin.bank_name,
        message="Administrator authentication successful.",
        admin=admin_data
    )

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Invalidates the active administrator session in PostgreSQL and clears the session cookie.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    raw_token = get_session_token_from_request(request)

    if raw_token:
        auth_service.revoke_session(
            db=db,
            raw_token=raw_token,
            client_ip=client_ip,
            user_agent=user_agent
        )

    # Clear session cookie
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE
    )

    return {"status": "success", "authenticated": False, "message": "Logged out successfully."}

@router.get("/session", response_model=SessionResponse)
def check_session(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Checks if an active, unexpired administrator session exists.
    Returns session metadata if authenticated; authenticated=False otherwise.
    """
    raw_token = get_session_token_from_request(request)
    if not raw_token:
        return SessionResponse(authenticated=False)

    session = auth_service.get_active_session(db, raw_token)
    if not session or not session.admin:
        return SessionResponse(authenticated=False)

    admin = session.admin
    admin_data = {
        "username": admin.username,
        "email": admin.email,
        "role": admin.role or "BUREAU_CHIEF",
        "displayName": admin.display_name or admin.username,
        "institutionId": admin.institution_id,
        "bankName": admin.bank_name
    }

    return SessionResponse(
        authenticated=True,
        username=admin.username,
        email=admin.email,
        role=admin.role or "BUREAU_CHIEF",
        display_name=admin.display_name or admin.username,
        institution_id=admin.institution_id,
        bank_name=admin.bank_name,
        session_id=session.id,
        expires_at=session.expires_at,
        admin=admin_data
    )

@router.post("/recover-initiate", response_model=PasswordRecoveryInitiateResponse)
def initiate_recovery(
    req: PasswordRecoveryInitiateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Initiates emergency password recovery for the bureau administrator.
    Generates a secure 15-minute single-use recovery token recorded in server logs.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    success, message, raw_token = auth_service.initiate_password_recovery(
        db=db,
        identifier=req.identifier.strip(),
        client_ip=client_ip,
        user_agent=user_agent
    )

    return PasswordRecoveryInitiateResponse(
        status="success",
        message=message,
        recovery_token=raw_token  # Provided to facilitate console verification
    )

@router.post("/recover-reset", response_model=PasswordRecoveryResetResponse)
def reset_password(
    req: PasswordRecoveryResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Resets the administrator password using a valid, unexpired one-time recovery token.
    Invalidates all existing sessions in PostgreSQL upon completion.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    success, message = auth_service.reset_password_with_recovery_token(
        db=db,
        raw_token=req.recovery_token.strip(),
        new_password=req.new_password,
        client_ip=client_ip,
        user_agent=user_agent
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return PasswordRecoveryResetResponse(
        status="success",
        message=message
    )
