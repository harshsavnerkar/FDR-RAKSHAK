import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import CORS_ORIGINS, ENVIRONMENT
from app.database import engine, Base, get_db
from app.routers import institutions_router, fdrs_router, dashboard_router
from app.services.seed_data import seed_database

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fdr_smartguard.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: verifies PostgreSQL connectivity and guarantees table schemas."""
    logger.info("Initializing FDR SmartGuard backend services...")
    try:
        # Create database tables if they do not exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified successfully.")

        # Seed initial sample data if empty
        with engine.begin() as conn:
            inst_count = conn.execute(text("SELECT count(*) FROM institutions")).scalar()
            if inst_count == 0:
                logger.info("Database empty on startup; seeding initial institutional records...")
                from app.database import SessionLocal
                with SessionLocal() as db:
                    seed_database(db)
                    logger.info("Initial seed completed.")
            else:
                logger.info(f"Database contains {inst_count} existing institution records; preserving data.")
    except Exception as exc:
        logger.error(f"Critical error during database initialization: {exc}")
        # Re-raise so server doesn't pretend to be healthy if DB failed
        raise exc

    yield
    logger.info("Shutting down FDR SmartGuard backend services.")

app = FastAPI(
    title="FDR SmartGuard — AICTE Security Deposit Governance Bureau API",
    description="Statutory Security Deposit and Fixed Deposit Receipt (FDR) Management Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Narrow CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Attach domain routers
app.include_router(institutions_router)
app.include_router(fdrs_router)
app.include_router(dashboard_router)

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Verifies API operational status and database connection health."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "fdr-smartguard-api",
            "database": "connected",
            "environment": ENVIRONMENT
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "service": "fdr-smartguard-api",
            "database": "error",
            "detail": str(exc)
        }

@app.post("/api/seed", tags=["Administration"], status_code=status.HTTP_200_OK)
def trigger_seed(db: Session = Depends(get_db)):
    """Idempotently seeds or refreshes the 10 demo institutional and FDR records."""
    return seed_database(db)

@app.get("/", tags=["Root"])
def root():
    return {
        "portal": "FDR SmartGuard / FDR Rakshak",
        "bureau": "AICTE Regulation Bureau New Delhi",
        "docs": "/docs",
        "health": "/api/health"
    }
