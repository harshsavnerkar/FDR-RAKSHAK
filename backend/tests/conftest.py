import pytest
from sqlalchemy import text
from app.database import engine, Base
import app.models  # Ensure all models are imported so Base.metadata knows about them

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensures all database tables and schema migrations exist prior to running test suites."""
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE fdrs ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;"))
    yield
