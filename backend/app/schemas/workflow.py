from datetime import date, datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

WORKFLOW_STATUTORY_DISCLAIMER = (
    "ADMINISTRATIVE DISCLAIMER: FDR SmartGuard lifecycle workflows record and govern internal "
    "AICTE regulatory decisions (renewals, replacements, lien release endorsements). The system "
    "does not execute interbank electronic funds transfers, auto-debits, or autonomous bank lien releases."
)

class LifecycleState(str, Enum):
    ACTIVE = "ACTIVE"
    RENEWAL_PENDING = "RENEWAL_PENDING"
    REPLACEMENT_PENDING = "REPLACEMENT_PENDING"
    RELEASE_REQUESTED = "RELEASE_REQUESTED"
    RELEASE_APPROVED = "RELEASE_APPROVED"
    RELEASED = "RELEASED"
    REJECTED = "REJECTED"

class WorkflowType(str, Enum):
    RENEWAL = "RENEWAL"
    REPLACEMENT = "REPLACEMENT"
    RELEASE = "RELEASE"

class WorkflowStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RenewalInitiateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reason: str = Field(min_length=5, description="Administrative justification for renewal")
    proposed_maturity_date: date = Field(description="New proposed maturity date (must be in future)")
    proposed_interest_rate: str | None = None
    renewal_certificate_no: str | None = None
    extended_tenure_months: int | None = Field(default=None, ge=1, le=120)
    requested_by: str = Field(default="AICTE Bureau Admin", min_length=2)
    notes: str | None = None

class ReplacementInitiateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reason: str = Field(min_length=5, description="Reason for replacement (damaged, bank merger, re-issue)")
    new_reference: str = Field(min_length=3, description="New unique reference identifier for replacement instrument")
    new_certificate_no: str | None = None
    replacement_reason: str = "Damaged or Superseded physical certificate"
    new_bank_name: str | None = None
    new_branch: str | None = None
    new_ifsc: str | None = None
    new_document_id: str | None = None
    requested_by: str = Field(default="AICTE Bureau Admin", min_length=2)
    notes: str | None = None

class ReleaseInitiateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reason: str = Field(min_length=5, description="Statutory justification for deposit release/refund")
    release_order_number: str = Field(min_length=3, description="Official government sanction / bureau release order reference")
    order_date: date | None = None
    settlement_account_details: str | None = None
    supporting_document_ref: str | None = None
    requested_by: str = Field(default="AICTE Bureau Admin", min_length=2)
    notes: str | None = None

class WorkflowDecisionRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    decision: WorkflowStatus = Field(description="APPROVED or REJECTED")
    decided_by: str = Field(default="AICTE Approving Authority", min_length=2)
    decision_notes: str = Field(min_length=3, description="Mandatory audit trail notes explaining decision")

class WorkflowItemOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    fdr_id: str
    workflow_type: str
    status: str
    reason: str
    request_date: date
    requested_by: str
    proposed_changes: dict[str, Any] = Field(default_factory=dict)
    decision_date: datetime | None = None
    decided_by: str | None = None
    decision_notes: str | None = None
    previous_lifecycle_status: str
    created_at: datetime
    updated_at: datetime

class FDRLifecycleOverview(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    reference: str
    institution_name: str
    deposit_amount: float
    current_maturity_date: date
    lifecycle_status: LifecycleState
    active_workflow: WorkflowItemOut | None = None
    available_actions: list[str] = Field(default_factory=list)
    workflow_history: list[WorkflowItemOut] = Field(default_factory=list)
    disclaimer: str = WORKFLOW_STATUTORY_DISCLAIMER

class WorkflowBatchSummary(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_workflows: int
    pending_count: int
    approved_count: int
    rejected_count: int
    lifecycle_breakdown: dict[str, int] = Field(default_factory=dict)
    recent_workflows: list[WorkflowItemOut] = Field(default_factory=list)
    disclaimer: str = WORKFLOW_STATUTORY_DISCLAIMER
