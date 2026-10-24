from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class FDRWorkflow(Base):
    __tablename__ = "fdr_workflows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    fdr_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("fdrs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    workflow_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    request_date: Mapped[date] = mapped_column(Date, nullable=False)
    requested_by: Mapped[str] = mapped_column(String(150), default="AICTE Bureau Admin", nullable=False)

    # JSON-encoded payload containing proposed renewal/replacement/release details
    proposed_changes: Mapped[str | None] = mapped_column(Text, nullable=True)

    decision_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    decision_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    previous_lifecycle_status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to FDR
    fdr = relationship("FDR", back_populates="workflows")

    def __repr__(self) -> str:
        return f"<FDRWorkflow(id='{self.id}', fdr_id='{self.fdr_id}', type='{self.workflow_type}', status='{self.status}')>"
