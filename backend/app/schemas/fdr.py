from datetime import date, datetime
from decimal import Decimal
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

class FDRBase(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reference: str = Field(..., min_length=3, max_length=64, description="Unique FDR Reference Number")
    institution_code: str = Field(..., min_length=2, max_length=64, description="Institution Code or ID")
    bank_name: str = Field(..., min_length=2, max_length=150, description="Issuing Bank Name")
    branch: str = Field(..., min_length=2, max_length=150, description="Issuing Branch Location")
    ifsc: str = Field(..., min_length=11, max_length=11, description="11-Character Indian Banking IFSC")
    certificate_no: str | None = Field(None, max_length=100)
    deposit_amount: Decimal = Field(..., gt=0, description="Deposit Amount in INR")
    currency: str = Field("INR", max_length=10)
    interest_rate: str | None = Field("7.10%", max_length=20)
    issue_date: date = Field(..., description="Date FDR was issued")
    maturity_date: date = Field(..., description="Date FDR matures")
    verification_status: str = Field("Pending", max_length=50)
    priority: str = Field("Standard", max_length=50)
    joint_lien_holder: str | None = Field(None, max_length=255)
    lien_status: str | None = Field("Lien Marked to AICTE New Delhi", max_length=100)
    ocr_confidence: float | None = Field(95.0, ge=0.0, le=100.0)
    physical_location: str | None = Field("Intake Vault / Staging Tray 01", max_length=150)
    discrepancy_note: str | None = None
    last_audited: date | None = None
    category: str | None = None

    @field_validator("reference")
    @classmethod
    def clean_ref(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("ifsc")
    @classmethod
    def validate_ifsc(cls, v: str) -> str:
        clean = v.strip().upper()
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean):
            raise ValueError("IFSC must be 11 characters (4 letters, digit 0, 6 alphanumeric, e.g. SBIN0001823).")
        return clean

    @model_validator(mode="after")
    def validate_dates(self):
        if self.issue_date and self.maturity_date:
            if self.maturity_date < self.issue_date:
                raise ValueError("Maturity date must be on or after issue date.")
        return self

class FDRCreate(FDRBase):
    pass

class FDRUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reference: str | None = Field(None, min_length=3, max_length=64)
    institution_code: str | None = None
    bank_name: str | None = Field(None, min_length=2, max_length=150)
    branch: str | None = Field(None, min_length=2, max_length=150)
    ifsc: str | None = None
    certificate_no: str | None = None
    deposit_amount: Decimal | None = Field(None, gt=0)
    currency: str | None = None
    interest_rate: str | None = None
    issue_date: date | None = None
    maturity_date: date | None = None
    verification_status: str | None = None
    priority: str | None = None
    joint_lien_holder: str | None = None
    lien_status: str | None = None
    ocr_confidence: float | None = Field(None, ge=0.0, le=100.0)
    physical_location: str | None = None
    discrepancy_note: str | None = None
    last_audited: date | None = None
    category: str | None = None

    @field_validator("ifsc")
    @classmethod
    def validate_ifsc(cls, v: str | None) -> str | None:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean):
            raise ValueError("IFSC must be 11 characters (e.g. SBIN0001823).")
        return clean

    @model_validator(mode="after")
    def validate_dates(self):
        if self.issue_date and self.maturity_date:
            if self.maturity_date < self.issue_date:
                raise ValueError("Maturity date must be on or after issue date.")
        return self

class FDROut(FDRBase):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    id: str
    institution_id: str
    deposit_amount: float
    institution: str = ""       # Joined institution name for frontend
    institution_code: str = ""  # Joined institution code for frontend
    trust: str | None = ""
    state: str | None = ""
    region: str | None = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None
