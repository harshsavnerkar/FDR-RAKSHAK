from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class LoginRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    username: str = Field(min_length=2, max_length=64, description="Administrator username")
    password: str = Field(min_length=4, max_length=128, description="Administrator password")

class LoginResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    status: str
    authenticated: bool = True
    username: str
    email: str
    role: Optional[str] = "BUREAU_CHIEF"
    display_name: Optional[str] = None
    institution_id: Optional[str] = None
    bank_name: Optional[str] = None
    message: str
    admin: Optional[dict] = None

class SessionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    authenticated: bool
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    display_name: Optional[str] = None
    institution_id: Optional[str] = None
    bank_name: Optional[str] = None
    session_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    admin: Optional[dict] = None

class PasswordRecoveryInitiateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    identifier: str = Field(min_length=2, description="Administrator username or registered email")

class PasswordRecoveryInitiateResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    status: str
    message: str
    recovery_token: Optional[str] = None

class PasswordRecoveryResetRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    recovery_token: str = Field(min_length=10, description="One-time recovery token issued by console")
    new_password: str = Field(min_length=8, max_length=128, description="New administrative password")

class PasswordRecoveryResetResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    status: str
    message: str

class SecurityAuditLogOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    event_type: str
    actor: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    details: Optional[str] = None
    created_at: datetime
