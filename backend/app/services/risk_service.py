import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.risk import (
    MaturityCategory,
    RiskPriority,
    RiskFactor,
    FDRRiskAssessment,
    MaturityCategoryCount,
    PriorityCount,
    MaturityRiskSummary
)
from app.schemas.compliance import FDRComplianceReport, ComplianceConfig
from app.services import compliance_service

logger = logging.getLogger("fdr_smartguard.risk_service")

# Priority ranking weights for sorting
PRIORITY_ORDER = {
    RiskPriority.CRITICAL: 4,
    RiskPriority.HIGH: 3,
    RiskPriority.MEDIUM: 2,
    RiskPriority.LOW: 1
}

def calculate_maturity_category(
    maturity_date: date | None,
    as_of: date | None = None
) -> tuple[MaturityCategory, int | None]:
    """
    Categorizes an FDR instrument into standard regulatory maturity windows.
    
    Rules:
      - EXPIRED: maturity_date < as_of (days_remaining < 0)
      - MATURING_30_DAYS: 0 <= days_remaining <= 30 (maturing today is MATURING_30_DAYS)
      - MATURING_60_DAYS: 31 <= days_remaining <= 60
      - MATURING_90_DAYS: 61 <= days_remaining <= 90
      - BEYOND_90_DAYS: days_remaining > 90
      - UNKNOWN: missing or invalid maturity date
    """
    if maturity_date is None:
        return MaturityCategory.UNKNOWN, None

    if not isinstance(maturity_date, date):
        try:
            if isinstance(maturity_date, str):
                maturity_date = date.fromisoformat(maturity_date)
            elif isinstance(maturity_date, datetime):
                maturity_date = maturity_date.date()
            else:
                return MaturityCategory.UNKNOWN, None
        except (ValueError, TypeError):
            return MaturityCategory.UNKNOWN, None

    today = as_of or date.today()
    days_remaining = (maturity_date - today).days

    if days_remaining < 0:
        return MaturityCategory.EXPIRED, days_remaining
    elif 0 <= days_remaining <= 30:
        return MaturityCategory.MATURING_30_DAYS, days_remaining
    elif 31 <= days_remaining <= 60:
        return MaturityCategory.MATURING_60_DAYS, days_remaining
    elif 61 <= days_remaining <= 90:
        return MaturityCategory.MATURING_90_DAYS, days_remaining
    else:
        return MaturityCategory.BEYOND_90_DAYS, days_remaining

def evaluate_fdr_risk(
    fdr: FDR,
    compliance_report: FDRComplianceReport | None = None,
    as_of: date | None = None
) -> FDRRiskAssessment:
    """
    Deterministically evaluates statutory risk priority, maturity horizon, and plain-language
    explanations for an FDR instrument.
    
    Reuses existing compliance engine results to prevent logic duplication.
    """
    today = as_of or date.today()
    maturity_category, days_remaining = calculate_maturity_category(fdr.maturity_date, as_of=today)

    # Evaluate or reuse compliance report
    report = compliance_report
    if report is None:
        report = compliance_service.evaluate_fdr_compliance(fdr, as_of_date=today)

    risk_factors: list[RiskFactor] = []
    base_score = 10.0  # Base regulatory baseline

    # 1. Maturity Risk Factor
    if maturity_category == MaturityCategory.EXPIRED:
        base_score += 50.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-EXPIRED",
            title="Statutory Instrument Expired",
            severity=RiskPriority.CRITICAL,
            description=f"Security deposit matured on {fdr.maturity_date} ({abs(days_remaining)} days overdue). Statutory lien is unrenewed and at immediate forfeiture default.",
            evidence={
                "maturityDate": str(fdr.maturity_date),
                "daysOverdue": abs(days_remaining),
                "asOfDate": str(today)
            }
        ))
    elif maturity_category == MaturityCategory.MATURING_30_DAYS:
        base_score += 35.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-IMMINENT-MATURITY",
            title="Imminent Maturity Window (<= 30 Days)",
            severity=RiskPriority.HIGH,
            description=f"Instrument matures in {days_remaining} day(s) on {fdr.maturity_date}. Tripartite renewal cycle requires immediate execution.",
            evidence={
                "maturityDate": str(fdr.maturity_date),
                "daysRemaining": days_remaining,
                "window": "<= 30 Days"
            }
        ))
    elif maturity_category == MaturityCategory.MATURING_60_DAYS:
        base_score += 20.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-APPROACHING-60",
            title="Approaching Maturity Window (31-60 Days)",
            severity=RiskPriority.MEDIUM,
            description=f"Instrument matures in {days_remaining} days on {fdr.maturity_date}. Scheduled renewal notice required.",
            evidence={
                "maturityDate": str(fdr.maturity_date),
                "daysRemaining": days_remaining,
                "window": "31-60 Days"
            }
        ))
    elif maturity_category == MaturityCategory.MATURING_90_DAYS:
        base_score += 10.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-APPROACHING-90",
            title="Upcoming Maturity Horizon (61-90 Days)",
            severity=RiskPriority.MEDIUM,
            description=f"Instrument matures in {days_remaining} days on {fdr.maturity_date}. Included in 90-day renewal monitoring calendar.",
            evidence={
                "maturityDate": str(fdr.maturity_date),
                "daysRemaining": days_remaining,
                "window": "61-90 Days"
            }
        ))
    elif maturity_category == MaturityCategory.UNKNOWN:
        base_score += 35.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-UNKNOWN-MATURITY",
            title="Missing or Unparseable Maturity Date",
            severity=RiskPriority.HIGH,
            description="The maturity date for this instrument is absent or invalid, preventing automated statutory expiry tracking.",
            evidence={"maturityDate": str(fdr.maturity_date)}
        ))

    # 2. Compliance Discrepancy & Violation Factors
    failed_checks = [c for c in report.checks if c.status == "FAIL"]
    warning_checks = [c for c in report.checks if c.status == "WARNING" and c.rule_id != "RULE-MATURITY-HORIZON"]
    review_checks = [c for c in report.checks if c.status == "NEEDS_REVIEW"]

    for fail in failed_checks:
        base_score += 35.0
        risk_factors.append(RiskFactor(
            factor_code=f"FACTOR-{fail.rule_id}",
            title=f"Statutory Violation: {fail.title}",
            severity=RiskPriority.CRITICAL,
            description=fail.explanation,
            evidence=fail.evidence
        ))

    for warn in warning_checks:
        base_score += 15.0
        risk_factors.append(RiskFactor(
            factor_code=f"FACTOR-{warn.rule_id}",
            title=f"Compliance Warning: {warn.title}",
            severity=RiskPriority.HIGH if maturity_category in (MaturityCategory.MATURING_30_DAYS, MaturityCategory.EXPIRED) else RiskPriority.MEDIUM,
            description=warn.explanation,
            evidence=warn.evidence
        ))

    # 3. Document Linkage & Review Factors (OCR uncertainty alone is NOT proof of fraud)
    doc_check = next((c for c in report.checks if c.rule_id == "RULE-DOC-LINK"), None)
    if doc_check and doc_check.status == "NEEDS_REVIEW":
        base_score += 10.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-UNLINKED-SCAN",
            title="Physical Receipt Scan Missing or Pending Intake",
            severity=RiskPriority.MEDIUM,
            description="Instrument currently operates on ledger data alone. Tripartite electronic scan is missing or awaiting manual review. (Note: Heuristic check only; does not establish authenticity or legal invalidity).",
            evidence=doc_check.evidence
        ))

    # 4. Verification Status Factor
    if fdr.verification_status == "Pending":
        base_score += 8.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-PENDING-LEDGER",
            title="Ledger Lien Verification Pending",
            severity=RiskPriority.MEDIUM,
            description="Ledger lien status is marked as Pending institutional/bank correspondence.",
            evidence={"verificationStatus": fdr.verification_status}
        ))
    elif fdr.verification_status == "Discrepancy":
        base_score += 25.0
        risk_factors.append(RiskFactor(
            factor_code="FACTOR-DISCREPANCY-FLAG",
            title="Ledger Marked Discrepancy",
            severity=RiskPriority.HIGH,
            description=f"Ledger record has active discrepancy flag: {fdr.discrepancy_note or 'Unspecified ledger conflict'}.",
            evidence={"discrepancyNote": fdr.discrepancy_note}
        ))

    # Bound priority score to 0.0 - 100.0
    priority_score = min(round(base_score, 1), 100.0)

    # Deterministic Priority Level Assignment
    if (
        maturity_category == MaturityCategory.EXPIRED or
        len(failed_checks) > 0 or
        priority_score >= 80.0
    ):
        priority = RiskPriority.CRITICAL
    elif (
        maturity_category == MaturityCategory.MATURING_30_DAYS or
        len(warning_checks) >= 2 or
        (maturity_category == MaturityCategory.MATURING_60_DAYS and fdr.verification_status == "Discrepancy") or
        priority_score >= 50.0
    ):
        priority = RiskPriority.HIGH
    elif (
        maturity_category in (MaturityCategory.MATURING_60_DAYS, MaturityCategory.MATURING_90_DAYS) or
        fdr.verification_status in ("Pending", "Discrepancy") or
        len(review_checks) > 0 or
        priority_score >= 25.0
    ):
        priority = RiskPriority.MEDIUM
    else:
        priority = RiskPriority.LOW

    # Generate Plain-Language Explanation
    if priority == RiskPriority.CRITICAL:
        critical_reasons = []
        if maturity_category == MaturityCategory.EXPIRED:
            critical_reasons.append(f"instrument expired {abs(days_remaining)} days ago")
        if failed_checks:
            critical_reasons.append(f"{len(failed_checks)} critical statutory compliance failure(s)")
        if not critical_reasons:
            critical_reasons.append(f"cumulative risk score of {priority_score}/100")
        explanation = (
            f"Assigned CRITICAL statutory priority because {', and '.join(critical_reasons)}. "
            "Requires immediate administrative or legal intervention to prevent institutional lien forfeiture."
        )
        recommended_action = (
            failed_checks[0].recommended_action if failed_checks
            else "Issue formal statutory notice of encashment or demand immediate renewal certificate from institution."
        )
    elif priority == RiskPriority.HIGH:
        high_reasons = []
        if maturity_category == MaturityCategory.MATURING_30_DAYS:
            high_reasons.append(f"maturity is imminent ({days_remaining} days remaining)")
        if warning_checks:
            high_reasons.append(f"{len(warning_checks)} active compliance warning(s)")
        explanation = (
            f"Assigned HIGH priority because {', and '.join(high_reasons or ['elevated compliance exposure'])}. "
            "Timely tripartite renewal notices and document intake are required to avoid default."
        )
        recommended_action = "Dispatch 30-day tripartite renewal reminder notice to institution management."
    elif priority == RiskPriority.MEDIUM:
        explanation = (
            f"Assigned MEDIUM priority. Instrument is active ({days_remaining or 'N/A'} days remaining) "
            "with standard monitoring requirements or pending document intake. No immediate statutory breach."
        )
        recommended_action = "Maintain scheduled renewal monitoring and review electronic scan intake."
    else:
        explanation = (
            f"Assigned LOW priority. Instrument is fully compliant, verified, and well within safe maturity horizon "
            f"({days_remaining} days remaining until {fdr.maturity_date})."
        )
        recommended_action = "No immediate regulatory action required. Standard custody tracking active."

    institution_name = fdr.institution.name if fdr.institution else "Unknown Institution"
    institution_code = fdr.institution.code if fdr.institution else ""

    return FDRRiskAssessment(
        fdr_id=fdr.id,
        reference=fdr.reference,
        institution_id=fdr.institution_id,
        institution_name=institution_name,
        institution_code=institution_code,
        bank_name=fdr.bank_name,
        deposit_amount=float(fdr.deposit_amount),
        currency=fdr.currency or "INR",
        maturity_date=fdr.maturity_date,
        maturity_category=maturity_category,
        days_remaining=days_remaining,
        priority=priority,
        priority_score=priority_score,
        risk_factors=risk_factors,
        explanation=explanation,
        recommended_action=recommended_action,
        compliance_status=report.overall_status,
        compliance_score=report.compliance_score,
        verification_status=fdr.verification_status,
        evaluated_at_date=today
    )

def evaluate_all_fdrs_risk(
    db: Session,
    as_of: date | None = None,
    priority_filter: str | None = None,
    maturity_filter: str | None = None,
    compliance_filter: str | None = None
) -> MaturityRiskSummary:
    """
    Evaluates risk and maturity categorization across all FDR records in the database.
    Returns categorized counts and a prioritized action queue sorted by urgency.
    """
    today = as_of or date.today()
    fdrs = list(db.scalars(select(FDR)).all())

    # Assess each FDR
    assessments: list[FDRRiskAssessment] = []
    for fdr in fdrs:
        assessments.append(evaluate_fdr_risk(fdr=fdr, as_of=today))

    # Sort prioritized queue:
    # 1. Priority order: CRITICAL > HIGH > MEDIUM > LOW
    # 2. Priority score descending
    # 3. Days remaining ascending (None/Unknown pushed to the end)
    # 4. Deposit amount descending
    def sort_key(item: FDRRiskAssessment):
        p_val = PRIORITY_ORDER.get(item.priority, 0)
        days = item.days_remaining if item.days_remaining is not None else 99999
        return (-p_val, -item.priority_score, days, -item.deposit_amount)

    assessments.sort(key=sort_key)

    total_corpus = sum(a.deposit_amount for a in assessments)

    # Calculate Breakdown by Priority
    crit_list = [a for a in assessments if a.priority == RiskPriority.CRITICAL]
    high_list = [a for a in assessments if a.priority == RiskPriority.HIGH]
    med_list = [a for a in assessments if a.priority == RiskPriority.MEDIUM]
    low_list = [a for a in assessments if a.priority == RiskPriority.LOW]

    priority_breakdown = [
        PriorityCount(
            priority=RiskPriority.CRITICAL,
            label="Critical Risk",
            count=len(crit_list),
            total_amount=sum(a.deposit_amount for a in crit_list)
        ),
        PriorityCount(
            priority=RiskPriority.HIGH,
            label="High Risk",
            count=len(high_list),
            total_amount=sum(a.deposit_amount for a in high_list)
        ),
        PriorityCount(
            priority=RiskPriority.MEDIUM,
            label="Medium Risk",
            count=len(med_list),
            total_amount=sum(a.deposit_amount for a in med_list)
        ),
        PriorityCount(
            priority=RiskPriority.LOW,
            label="Low Risk",
            count=len(low_list),
            total_amount=sum(a.deposit_amount for a in low_list)
        )
    ]

    # Calculate Breakdown by Maturity Window
    exp_list = [a for a in assessments if a.maturity_category == MaturityCategory.EXPIRED]
    m30_list = [a for a in assessments if a.maturity_category == MaturityCategory.MATURING_30_DAYS]
    m60_list = [a for a in assessments if a.maturity_category == MaturityCategory.MATURING_60_DAYS]
    m90_list = [a for a in assessments if a.maturity_category == MaturityCategory.MATURING_90_DAYS]
    b90_list = [a for a in assessments if a.maturity_category == MaturityCategory.BEYOND_90_DAYS]
    unk_list = [a for a in assessments if a.maturity_category == MaturityCategory.UNKNOWN]

    maturity_breakdown = [
        MaturityCategoryCount(
            category=MaturityCategory.EXPIRED,
            label="Expired (< 0 Days)",
            count=len(exp_list),
            total_amount=sum(a.deposit_amount for a in exp_list)
        ),
        MaturityCategoryCount(
            category=MaturityCategory.MATURING_30_DAYS,
            label="Imminent (0-30 Days)",
            count=len(m30_list),
            total_amount=sum(a.deposit_amount for a in m30_list)
        ),
        MaturityCategoryCount(
            category=MaturityCategory.MATURING_60_DAYS,
            label="Approaching (31-60 Days)",
            count=len(m60_list),
            total_amount=sum(a.deposit_amount for a in m60_list)
        ),
        MaturityCategoryCount(
            category=MaturityCategory.MATURING_90_DAYS,
            label="Upcoming (61-90 Days)",
            count=len(m90_list),
            total_amount=sum(a.deposit_amount for a in m90_list)
        ),
        MaturityCategoryCount(
            category=MaturityCategory.BEYOND_90_DAYS,
            label="Long Term (> 90 Days)",
            count=len(b90_list),
            total_amount=sum(a.deposit_amount for a in b90_list)
        ),
        MaturityCategoryCount(
            category=MaturityCategory.UNKNOWN,
            label="Unknown Date",
            count=len(unk_list),
            total_amount=sum(a.deposit_amount for a in unk_list)
        )
    ]

    # Filter prioritized queue if query params provided
    filtered_queue = assessments
    if priority_filter and priority_filter.upper() != "ALL":
        filtered_queue = [a for a in filtered_queue if a.priority.value == priority_filter.upper()]
    if maturity_filter and maturity_filter.upper() != "ALL":
        filtered_queue = [a for a in filtered_queue if a.maturity_category.value == maturity_filter.upper()]
    if compliance_filter and compliance_filter.upper() != "ALL":
        filtered_queue = [a for a in filtered_queue if a.compliance_status == compliance_filter.upper()]

    return MaturityRiskSummary(
        total_instruments=len(assessments),
        total_deposit_corpus=round(total_corpus, 2),
        as_of_date=today,
        critical_count=len(crit_list),
        high_count=len(high_list),
        medium_count=len(med_list),
        low_count=len(low_list),
        expired_count=len(exp_list),
        maturing_30_count=len(m30_list),
        maturing_60_count=len(m60_list),
        maturing_90_count=len(m90_list),
        beyond_90_count=len(b90_list),
        unknown_count=len(unk_list),
        priority_breakdown=priority_breakdown,
        maturity_breakdown=maturity_breakdown,
        prioritized_queue=filtered_queue
    )
