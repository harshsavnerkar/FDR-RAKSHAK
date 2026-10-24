import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import DATABASE_URL

logger = logging.getLogger("fdr_smartguard.database")

# Configure database engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Automatically verify connection viability
    pool_size=10,
    max_overflow=20,
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

def get_db():
    """Dependency that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        logger.error(f"Database session error: {exc}")
        db.rollback()
        raise
    finally:
        db.close()
