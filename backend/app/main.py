import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import CORS_ORIGINS, ENVIRONMENT
from app.database import engine, Base, get_db
from app.routers import (
    institutions_router,
    fdrs_router,
    dashboard_router,
    documents_router,
    compliance_router,
    risk_router,
    workflows_router,
    auth_router,
    audit_logs_router
)
from app.dependencies.auth import get_current_admin
from app.services.seed_data import seed_database
from app.services.auth_service import ensure_initial_admin

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fdr_rakshak.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: verifies PostgreSQL connectivity, table schemas, and administrator initialization."""
    logger.info("Initializing FDR Rakshak backend services...")
    try:
        # Create database tables if they do not exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified successfully.")

        # Ensure lifecycle_status column exists in fdrs table
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE fdrs ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;"))

        from app.database import SessionLocal
        with SessionLocal() as db:
            # Seed initial institutional sample data if empty
            inst_count = db.execute(text("SELECT count(*) FROM institutions")).scalar()
            if inst_count == 0:
                logger.info("Database empty on startup; seeding initial institutional records...")
                seed_database(db)
                logger.info("Initial seed completed.")
            else:
                logger.info(f"Database contains {inst_count} existing institution records; preserving data.")

            # Ensure initial administrator exists in PostgreSQL
            ensure_initial_admin(db)
    except Exception as exc:
        logger.error(f"Critical error during database initialization: {exc}")
        # Re-raise so server doesn't pretend to be healthy if DB failed
        raise exc

    yield
    logger.info("Shutting down FDR Rakshak backend services.")

app = FastAPI(
    title="FDR Rakshak — AICTE Security Deposit Governance Bureau API",
    description="Statutory Security Deposit and Fixed Deposit Receipt (FDR) Management Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Security Response Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Injects standard regulatory security headers on all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Narrow CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Public Authentication Router
app.include_router(auth_router)

# Protected Domain Routers (strictly require valid administrator session)
auth_dependency = [Depends(get_current_admin)]
app.include_router(institutions_router, dependencies=auth_dependency)
app.include_router(fdrs_router, dependencies=auth_dependency)
app.include_router(dashboard_router, dependencies=auth_dependency)
app.include_router(documents_router, dependencies=auth_dependency)
app.include_router(compliance_router, dependencies=auth_dependency)
app.include_router(risk_router, dependencies=auth_dependency)
app.include_router(workflows_router, dependencies=auth_dependency)
app.include_router(audit_logs_router, dependencies=auth_dependency)

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Verifies API operational status and database connection health."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "fdr-rakshak-api",
            "database": "connected",
            "environment": ENVIRONMENT
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "service": "fdr-rakshak-api",
            "database": "error",
            "detail": str(exc)
        }

@app.post("/api/seed", tags=["Administration"], status_code=status.HTTP_200_OK, dependencies=auth_dependency)
def trigger_seed(db: Session = Depends(get_db)):
    """Idempotently seeds or refreshes institutional and FDR records."""
    return seed_database(db)

@app.get("/", tags=["Root"])
def root():
    return {
        "portal": "FDR Rakshak",
        "bureau": "AICTE Regulation Bureau New Delhi",
        "docs": "/docs",
        "health": "/api/health"
    }
