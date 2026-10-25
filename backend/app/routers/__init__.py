from app.routers.institutions import router as institutions_router
from app.routers.fdrs import router as fdrs_router
from app.routers.dashboard import router as dashboard_router
from app.routers.documents import router as documents_router
from app.routers.compliance import router as compliance_router
from app.routers.risk import router as risk_router
from app.routers.workflows import router as workflows_router
from app.routers.auth import router as auth_router
from app.routers.audit_logs import router as audit_logs_router

__all__ = [
    "institutions_router",
    "fdrs_router",
    "dashboard_router",
    "documents_router",
    "compliance_router",
    "risk_router",
    "workflows_router",
    "auth_router",
    "audit_logs_router"
]
