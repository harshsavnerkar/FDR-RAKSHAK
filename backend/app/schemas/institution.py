from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel
import re

class InstitutionBase(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=255, description="Official Technical Institution Name")
    code: str = Field(..., min_length=2, max_length=64, description="Unique AICTE Institution Code")
    pid: str | None = Field(None, max_length=64, description="Permanent Institute ID (PID)")
    type: str = Field(..., min_length=2, max_length=100, description="Discipline Category")
    pincode: str = Field(..., description="6-digit Indian Postal PIN Code")
    state: str = Field(..., min_length=2, max_length=100, description="State or Union Territory")
    city: str = Field(..., min_length=1, max_length=100, description="City or Town")
    address: str = Field(..., min_length=3, max_length=255, description="Campus street address")
    trust: str | None = Field(None, max_length=255, description="Sponsoring Trust or Society")
    contact_person: str = Field(..., min_length=2, max_length=120, description="Authorized Contact Person")
    email: EmailStr = Field(..., description="Official Contact Email")
    phone: str = Field(..., min_length=10, max_length=50, description="Contact Phone Number")

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = re.sub(r"\D", "", v)
        if len(clean) != 6:
            raise ValueError("Postal PIN code must be exactly 6 digits (e.g. 560001).")
        return clean

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(None, min_length=2, max_length=255)
    code: str | None = Field(None, min_length=2, max_length=64)
    pid: str | None = Field(None, max_length=64)
    type: str | None = Field(None, min_length=2, max_length=100)
    pincode: str | None = None
    state: str | None = Field(None, min_length=2, max_length=100)
    city: str | None = Field(None, min_length=1, max_length=100)
    address: str | None = Field(None, min_length=3, max_length=255)
    trust: str | None = None
    contact_person: str | None = Field(None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=10, max_length=50)

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str | None) -> str | None:
        if v is None:
            return None
        clean = re.sub(r"\D", "", v)
        if len(clean) != 6:
            raise ValueError("Postal PIN code must be exactly 6 digits.")
        return clean

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str | None) -> str | None:
        return v.strip().upper() if v else None

class InstitutionOut(InstitutionBase):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    id: str
    fdr_count: int = 0
    total_deposit: float = 0.0
    created_at: datetime | None = None
    updated_at: datetime | None = None
