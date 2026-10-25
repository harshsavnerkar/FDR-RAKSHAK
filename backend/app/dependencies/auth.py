import logging
from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Cookie, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import SESSION_COOKIE_NAME
from app.models.admin import AdminUser
from app.models.session import AdminSession
from app.services import auth_service

logger = logging.getLogger("fdr_rakshak.auth_dependency")

def get_session_token_from_request(
    request: Request
) -> Optional[str]:
    """
    Extracts raw session token from HTTP-only cookie or Authorization: Bearer header.
    Cookie takes primary precedence for browser navigation; header supports automated testing.
    """
    cookie_token = request.cookies.get(SESSION_COOKIE_NAME)
    if cookie_token and cookie_token.strip():
        return cookie_token.strip()

    authorization = request.headers.get("Authorization")
    if authorization and isinstance(authorization, str) and authorization.startswith("Bearer "):
        bearer_token = authorization[7:].strip()
        if bearer_token:
            return bearer_token

    return None

def get_current_session(
    request: Request,
    db: Session = Depends(get_db)
) -> AdminSession:
    """
    Validates the active administrator session from PostgreSQL.
    Raises HTTP 401 if token is missing, invalid, expired, or revoked.
    """
    raw_token = get_session_token_from_request(request)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: No active session detected. Please log in."
        )

    session = auth_service.get_active_session(db, raw_token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, revoked, or invalid. Please re-authenticate."
        )

    return session

def get_current_admin(
    session: AdminSession = Depends(get_current_session)
) -> AdminUser:
    """
    Guarantees the request is executed by an authenticated AICTE bureau administrator.
    """
    if not session.admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator account not found for current session."
        )
    return session.admin
