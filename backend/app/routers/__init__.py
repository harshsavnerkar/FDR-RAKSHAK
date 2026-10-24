from app.routers.institutions import router as institutions_router
from app.routers.fdrs import router as fdrs_router
from app.routers.dashboard import router as dashboard_router

__all__ = ["institutions_router", "fdrs_router", "dashboard_router"]
