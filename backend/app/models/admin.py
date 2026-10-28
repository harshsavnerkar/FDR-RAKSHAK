import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Sovereign Role-Based Access Control (RBAC)
    # Roles: BUREAU_CHIEF | SCRUTINY_OFFICER | INSTITUTION_USER | BANK_NODE
    role: Mapped[str] = mapped_column(String(50), default="BUREAU_CHIEF", nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    institution_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("institutions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    bank_name: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)

    recovery_token_hash: Mapped[str | None] = mapped_column(String(128), unique=True, index=True, nullable=True)
    recovery_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sessions = relationship("AdminSession", back_populates="admin", cascade="all, delete-orphan")
    institution = relationship("Institution", foreign_keys=[institution_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<AdminUser(id='{self.id}', username='{self.username}', role='{self.role}')>"
