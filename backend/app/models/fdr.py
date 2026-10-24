from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Date, DateTime, Numeric, Text, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class FDR(Base):
    __tablename__ = "fdrs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    reference: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    institution_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("institutions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    bank_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    branch: Mapped[str] = mapped_column(String(150), nullable=False)
    ifsc: Mapped[str] = mapped_column(String(20), nullable=False)
    certificate_no: Mapped[str | None] = mapped_column(String(100), nullable=True)

    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    interest_rate: Mapped[str | None] = mapped_column(String(20), nullable=True)

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    verification_status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(50), default="Standard", nullable=False, index=True)

    joint_lien_holder: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lien_status: Mapped[str | None] = mapped_column(String(100), default="Lien Marked to AICTE New Delhi", nullable=True)
    ocr_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), default=95.0, nullable=True)
    physical_location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    discrepancy_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_audited: Mapped[date | None] = mapped_column(Date, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Institution
    institution = relationship("Institution", back_populates="fdrs")

    __table_args__ = (
        CheckConstraint("deposit_amount > 0", name="check_positive_deposit_amount"),
        CheckConstraint("maturity_date >= issue_date", name="check_maturity_after_issue"),
    )

    def __repr__(self) -> str:
        return f"<FDR(reference='{self.reference}', amount={self.deposit_amount}, bank='{self.bank_name}')>"
