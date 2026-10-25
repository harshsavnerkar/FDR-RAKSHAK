import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AdminSession(Base):
    __tablename__ = "admin_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    admin_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("admin_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    admin = relationship("AdminUser", back_populates="sessions")

    def __repr__(self) -> str:
        return f"<AdminSession(id='{self.id}', admin_id='{self.admin_id}', revoked={self.is_revoked})>"
