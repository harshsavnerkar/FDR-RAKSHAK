import pytest
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
import app.models
from app.main import app
from app.models.admin import AdminUser
from app.dependencies.auth import get_current_admin
from app.services.auth_service import ensure_initial_admin

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensures all database tables and schema migrations exist prior to running test suites."""
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE fdrs ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;"))
        conn.execute(text("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'BUREAU_CHIEF' NOT NULL;"))
        conn.execute(text("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);"))
        conn.execute(text("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS institution_id VARCHAR(64);"))
        conn.execute(text("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);"))

    with SessionLocal() as db:
        admin = ensure_initial_admin(db)
        admin_copy = AdminUser(
            id=admin.id,
            username=admin.username,
            email=admin.email,
            password_hash=admin.password_hash,
            role=getattr(admin, "role", "BUREAU_CHIEF"),
            display_name=getattr(admin, "display_name", None),
            institution_id=getattr(admin, "institution_id", None),
            bank_name=getattr(admin, "bank_name", None)
        )

    # By default, authorize existing domain tests via dependency override
    app.dependency_overrides[get_current_admin] = lambda: admin_copy

    yield

    app.dependency_overrides.clear()
