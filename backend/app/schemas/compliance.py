from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

STATUTORY_COMPLIANCE_DISCLAIMER = (
    "STATUTORY NOTICE: Automated compliance and discrepancy evaluation is an administrative decision-support "
    "tool and does not constitute statutory verification of bank lien authenticity or legal discharge. "
    "All discrepancies must be reviewed by an authorized AICTE bureau officer against original bank records."
)

class RuleCheckResult(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    rule_id: str
    title: str
    status: str  # PASS | WARNING | FAIL | NEEDS_REVIEW
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW | INFO
    evidence: dict[str, Any] = Field(default_factory=dict)
    explanation: str
    recommended_action: str

class ComplianceConfig(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    approaching_maturity_days: int = 90
    amount_tolerance: float = 1.0
    ocr_confidence_threshold: float = 75.0

class FDRComplianceReport(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    reference: str
    institution_code: str
    institution_name: str
    bank_name: str
    deposit_amount: float
    overall_status: str  # COMPLIANT | NON_COMPLIANT | ACTION_REQUIRED | UNDER_REVIEW
    compliance_score: float
    total_rules: int
    pass_count: int
    warning_count: int
    fail_count: int
    needs_review_count: int
    summary_explanation: str
    recommended_next_action: str
    checks: list[RuleCheckResult]
    disclaimer: str = STATUTORY_COMPLIANCE_DISCLAIMER
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplianceSummaryItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    reference: str
    institution: str
    institution_code: str
    deposit_amount: float
    overall_status: str
    compliance_score: float
    fail_count: int
    warning_count: int
    needs_review_count: int
    primary_issue: str | None = None
    recommended_action: str

class ComplianceBatchSummary(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_instruments: int
    compliant_count: int
    non_compliant_count: int
    action_required_count: int
    under_review_count: int
    average_compliance_score: float
    instruments: list[ComplianceSummaryItem]
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomComplianceRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    ocr_extracted_fields: dict[str, Any]
    ocr_confidence: float | None = 90.0
    config: ComplianceConfig | None = None
