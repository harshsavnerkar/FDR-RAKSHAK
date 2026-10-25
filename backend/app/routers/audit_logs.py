import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.audit_log import SecurityAuditLog
from app.schemas.auth import SecurityAuditLogOut
from app.dependencies.auth import get_current_admin

logger = logging.getLogger("fdr_rakshak.audit_logs_router")

router = APIRouter(prefix="/api/audit-logs", tags=["Persistent Security Audit Ledger"])

@router.get("", response_model=List[SecurityAuditLogOut])
def get_security_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """
    Retrieves tamper-evident security and workflow audit ledger events from PostgreSQL.
    Strictly protected: requires an active administrator session.
    """
    stmt = select(SecurityAuditLog)

    if event_type:
        stmt = stmt.where(SecurityAuditLog.event_type == event_type)
    if status:
        stmt = stmt.where(SecurityAuditLog.status == status)

    stmt = stmt.order_by(desc(SecurityAuditLog.created_at)).offset(offset).limit(limit)

    logs = list(db.scalars(stmt).all())
    return [
        SecurityAuditLogOut(
            id=log.id,
            event_type=log.event_type,
            actor=log.actor,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            status=log.status,
            details=log.details,
            created_at=log.created_at
        )
        for log in logs
    ]
