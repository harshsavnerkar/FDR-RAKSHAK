from datetime import date
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class MaturityCategory(str, Enum):
    EXPIRED = "EXPIRED"
    MATURING_30_DAYS = "MATURING_30_DAYS"
    MATURING_60_DAYS = "MATURING_60_DAYS"
    MATURING_90_DAYS = "MATURING_90_DAYS"
    BEYOND_90_DAYS = "BEYOND_90_DAYS"
    UNKNOWN = "UNKNOWN"

class RiskPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RiskFactor(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    factor_code: str
    title: str
    severity: RiskPriority
    description: str
    evidence: dict[str, Any] = Field(default_factory=dict)

class FDRRiskAssessment(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    reference: str
    institution_id: str
    institution_name: str
    institution_code: str
    bank_name: str
    deposit_amount: float
    currency: str = "INR"

    maturity_date: date | None = None
    maturity_category: MaturityCategory
    days_remaining: int | None = None

    priority: RiskPriority
    priority_score: float = Field(ge=0.0, le=100.0, description="Deterministic 0-100 ranking score for priority sorting")
    risk_factors: list[RiskFactor] = Field(default_factory=list)

    explanation: str
    recommended_action: str

    compliance_status: str | None = None
    compliance_score: float | None = None
    verification_status: str

    evaluated_at_date: date

class MaturityCategoryCount(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    category: MaturityCategory
    label: str
    count: int
    total_amount: float

class PriorityCount(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    priority: RiskPriority
    label: str
    count: int
    total_amount: float

class MaturityRiskSummary(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_instruments: int
    total_deposit_corpus: float
    as_of_date: date

    # Counts by Priority
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

    # Counts by Maturity Window
    expired_count: int
    maturing_30_count: int
    maturing_60_count: int
    maturing_90_count: int
    beyond_90_count: int
    unknown_count: int

    priority_breakdown: list[PriorityCount]
    maturity_breakdown: list[MaturityCategoryCount]

    # Prioritized urgent action queue
    prioritized_queue: list[FDRRiskAssessment] = Field(default_factory=list)
