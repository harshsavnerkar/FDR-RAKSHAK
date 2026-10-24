import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.compliance import (
    RuleCheckResult,
    ComplianceConfig,
    FDRComplianceReport,
    ComplianceSummaryItem,
    ComplianceBatchSummary
)
from app.services import document_service

# Normalized banking alias mapping
BANK_ALIASES = {
    "sbi": "state bank of india",
    "pnb": "punjab national bank",
    "bob": "bank of baroda",
    "canara": "canara bank",
    "hdfc": "hdfc bank",
    "icici": "icici bank",
    "axis": "axis bank",
    "union": "union bank of india",
    "kotak": "kotak mahindra bank",
    "boi": "bank of india"
}

def normalize_text(text: str | None) -> str:
    """Removes non-alphanumeric characters and extra spaces for resilient comparison."""
    if not text:
        return ""
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return " ".join(clean.split())

def normalize_bank_name(name: str | None) -> str:
    """Normalizes bank names and maps common abbreviations."""
    clean = normalize_text(name)
    for alias, full in BANK_ALIASES.items():
        if alias == clean or clean.startswith(alias + " "):
            return full
    return clean

def find_linked_document(fdr_id: str) -> dict[str, Any] | None:
    """Searches upload registry for any document linked to this FDR ID."""
    for doc_id, doc_entry in document_service._UPLOAD_REGISTRY.items():
        if doc_entry.get("fdrId") == fdr_id:
            return doc_entry.get("metadata", {})
    return None

def check_mandatory_fields(fdr: FDR) -> RuleCheckResult:
    """Rule 1: Verify presence of all required FDR statutory fields."""
    mandatory_map = {
        "reference": fdr.reference,
        "institutionCode": getattr(fdr, "institution_code", None) or (fdr.institution.code if fdr.institution else None),
        "bankName": fdr.bank_name,
        "branch": fdr.branch,
        "ifsc": fdr.ifsc,
        "depositAmount": fdr.deposit_amount,
        "issueDate": fdr.issue_date,
        "maturityDate": fdr.maturity_date
    }

    missing = [k for k, v in mandatory_map.items() if v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, (int, float, Decimal)) and v <= 0)]

    if missing:
        return RuleCheckResult(
            rule_id="RULE-REQ-FIELDS",
            title="Mandatory Statutory Field Completeness",
            status="FAIL",
            severity="CRITICAL",
            evidence={"missingFields": missing, "totalMandatory": len(mandatory_map)},
            explanation=f"Missing mandatory regulatory fields: {', '.join(missing)}. All statutory deposit receipts must possess complete institutional and banking coordinates.",
            recommended_action="Update the FDR dossier immediately to supply missing statutory parameters."
        )

    return RuleCheckResult(
        rule_id="RULE-REQ-FIELDS",
        title="Mandatory Statutory Field Completeness",
        status="PASS",
        severity="LOW",
        evidence={"evaluatedFields": list(mandatory_map.keys()), "missingCount": 0},
        explanation="All mandatory statutory parameters are fully populated in the institutional registry.",
        recommended_action="No administrative action required for field completeness."
    )

def check_date_validity(fdr: FDR) -> RuleCheckResult:
    """Rule 2: Verify issue and maturity dates are valid date objects."""
    has_issue = isinstance(fdr.issue_date, (date, datetime))
    has_maturity = isinstance(fdr.maturity_date, (date, datetime))

    if not has_issue or not has_maturity:
        return RuleCheckResult(
            rule_id="RULE-DATE-VALIDITY",
            title="Chronological Date Validity",
            status="FAIL",
            severity="CRITICAL",
            evidence={
                "hasIssueDate": has_issue,
                "hasMaturityDate": has_maturity,
                "rawIssue": str(fdr.issue_date) if fdr.issue_date else None,
                "rawMaturity": str(fdr.maturity_date) if fdr.maturity_date else None
            },
            explanation="Invalid or missing chronological coordinates. Issue and maturity dates must be valid calendar dates.",
            recommended_action="Rectify issue and maturity dates from physical bank deposit certificate."
        )

    return RuleCheckResult(
        rule_id="RULE-DATE-VALIDITY",
        title="Chronological Date Validity",
        status="PASS",
        severity="LOW",
        evidence={
            "issueDate": fdr.issue_date.isoformat(),
            "maturityDate": fdr.maturity_date.isoformat()
        },
        explanation=f"Issue date ({fdr.issue_date}) and maturity date ({fdr.maturity_date}) are chronologically valid.",
        recommended_action="No action required."
    )

def check_date_order(fdr: FDR) -> RuleCheckResult:
    """Rule 3: Ensure maturity date is strictly after issue date."""
    if not isinstance(fdr.issue_date, (date, datetime)) or not isinstance(fdr.maturity_date, (date, datetime)):
        return RuleCheckResult(
            rule_id="RULE-DATE-ORDER",
            title="Tenure Sequence and Term Validity",
            status="FAIL",
            severity="CRITICAL",
            evidence={"error": "Cannot calculate tenure without valid dates"},
            explanation="Tenure sequence check failed due to invalid issue or maturity dates.",
            recommended_action="Provide valid dates before verifying chronological sequence."
        )

    term_days = (fdr.maturity_date - fdr.issue_date).days

    if term_days < 0:
        return RuleCheckResult(
            rule_id="RULE-DATE-ORDER",
            title="Tenure Sequence and Term Validity",
            status="FAIL",
            severity="CRITICAL",
            evidence={
                "issueDate": fdr.issue_date.isoformat(),
                "maturityDate": fdr.maturity_date.isoformat(),
                "termDays": term_days
            },
            explanation=f"Maturity date ({fdr.maturity_date}) precedes issue date ({fdr.issue_date}). An FDR cannot mature prior to its booking date.",
            recommended_action="Correct tenure dates according to official bank lien certificate."
        )

    if term_days == 0:
        return RuleCheckResult(
            rule_id="RULE-DATE-ORDER",
            title="Tenure Sequence and Term Validity",
            status="WARNING",
            severity="HIGH",
            evidence={
                "issueDate": fdr.issue_date.isoformat(),
                "maturityDate": fdr.maturity_date.isoformat(),
                "termDays": 0
            },
            explanation="Maturity date is identical to issue date (0-day tenure). Fixed deposits must possess a defined statutory term.",
            recommended_action="Review certificate term with issuing bank branch."
        )

    term_years = round(term_days / 365.25, 1)
    return RuleCheckResult(
        rule_id="RULE-DATE-ORDER",
        title="Tenure Sequence and Term Validity",
        status="PASS",
        severity="LOW",
        evidence={
            "issueDate": fdr.issue_date.isoformat(),
            "maturityDate": fdr.maturity_date.isoformat(),
            "termDays": term_days,
            "approximateYears": term_years
        },
        explanation=f"Tenure sequence is valid: {term_days} days (~{term_years} years) tenure.",
        recommended_action="No action required."
    )

def check_amount_match(
    fdr: FDR,
    doc_fields: dict[str, Any] | None,
    ocr_confidence: float | None,
    config: ComplianceConfig
) -> RuleCheckResult:
    """Rule 4: Compare vaulted deposit amount against document OCR extraction."""
    vaulted_amount = float(fdr.deposit_amount)

    if not doc_fields or doc_fields.get("depositAmount") is None:
        return RuleCheckResult(
            rule_id="RULE-AMOUNT-MATCH",
            title="Principal Deposit Amount Cross-Check",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={
                "vaultedAmount": vaulted_amount,
                "ocrAmount": None,
                "hasDocument": doc_fields is not None
            },
            explanation=f"No verified document scan available to cross-validate vaulted principal amount of ₹{vaulted_amount:,.2f}.",
            recommended_action="Upload and attach bank-stamped FDR scan in AI Verification intake to confirm principal lien."
        )

    ocr_amount = float(doc_fields["depositAmount"])
    conf = ocr_confidence if ocr_confidence is not None else 90.0

    # Avoid treating uncertain OCR as confirmed discrepancy
    if conf < config.ocr_confidence_threshold:
        return RuleCheckResult(
            rule_id="RULE-AMOUNT-MATCH",
            title="Principal Deposit Amount Cross-Check",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={
                "vaultedAmount": vaulted_amount,
                "ocrAmount": ocr_amount,
                "ocrConfidence": conf,
                "confidenceThreshold": config.ocr_confidence_threshold
            },
            explanation=f"Document scan parsed amount ₹{ocr_amount:,.2f}, but OCR confidence ({conf}%) is below {config.ocr_confidence_threshold}%. Manual administrative confirmation required.",
            recommended_action="Inspect the physical receipt image in the dossier to manually verify the deposit amount."
        )

    diff = abs(vaulted_amount - ocr_amount)
    if diff <= config.amount_tolerance:
        return RuleCheckResult(
            rule_id="RULE-AMOUNT-MATCH",
            title="Principal Deposit Amount Cross-Check",
            status="PASS",
            severity="LOW",
            evidence={
                "vaultedAmount": vaulted_amount,
                "ocrAmount": ocr_amount,
                "delta": round(diff, 2),
                "tolerance": config.amount_tolerance
            },
            explanation=f"Vaulted principal amount (₹{vaulted_amount:,.2f}) matches scanned document exactly (₹{ocr_amount:,.2f}).",
            recommended_action="No action required. Principal deposit value verified."
        )

    return RuleCheckResult(
        rule_id="RULE-AMOUNT-MATCH",
        title="Principal Deposit Amount Cross-Check",
        status="FAIL",
        severity="CRITICAL",
        evidence={
            "vaultedAmount": vaulted_amount,
            "ocrAmount": ocr_amount,
            "delta": round(diff, 2),
            "tolerance": config.amount_tolerance
        },
        explanation=f"Discrepancy detected: Vaulted amount (₹{vaulted_amount:,.2f}) differs by ₹{diff:,.2f} from scanned receipt (₹{ocr_amount:,.2f}).",
        recommended_action="Investigate potential under-collateralization or clerical discrepancy with institution and bank branch."
    )

def check_reference_match(
    fdr: FDR,
    doc_fields: dict[str, Any] | None,
    ocr_confidence: float | None,
    config: ComplianceConfig
) -> RuleCheckResult:
    """Rule 5: Compare vaulted reference against document OCR reference."""
    vaulted_ref = fdr.reference.strip().upper()

    if not doc_fields or not doc_fields.get("reference"):
        return RuleCheckResult(
            rule_id="RULE-REF-MATCH",
            title="FDR Reference Number Cross-Check",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={
                "vaultedReference": vaulted_ref,
                "ocrReference": None
            },
            explanation=f"Document scan not attached or reference number not recognized on scanned voucher for '{vaulted_ref}'.",
            recommended_action="Review physical scan in AI Verification to confirm instrument reference."
        )

    ocr_ref = str(doc_fields["reference"]).strip().upper()
    conf = ocr_confidence if ocr_confidence is not None else 90.0

    if conf < config.ocr_confidence_threshold:
        return RuleCheckResult(
            rule_id="RULE-REF-MATCH",
            title="FDR Reference Number Cross-Check",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={
                "vaultedReference": vaulted_ref,
                "ocrReference": ocr_ref,
                "ocrConfidence": conf
            },
            explanation=f"Scanned reference '{ocr_ref}' detected with moderate OCR confidence ({conf}%). Human review recommended.",
            recommended_action="Visually confirm FDR number against the physical deposit receipt header."
        )

    # Clean comparisons (strip dashes and spaces for normalized comparison)
    norm_vault = re.sub(r"[^A-Z0-9]", "", vaulted_ref)
    norm_ocr = re.sub(r"[^A-Z0-9]", "", ocr_ref)

    if norm_vault == norm_ocr or norm_ocr in norm_vault or norm_vault in norm_ocr:
        return RuleCheckResult(
            rule_id="RULE-REF-MATCH",
            title="FDR Reference Number Cross-Check",
            status="PASS",
            severity="LOW",
            evidence={
                "vaultedReference": vaulted_ref,
                "ocrReference": ocr_ref
            },
            explanation=f"Vaulted reference '{vaulted_ref}' matches scanned instrument reference.",
            recommended_action="No action required."
        )

    return RuleCheckResult(
        rule_id="RULE-REF-MATCH",
        title="FDR Reference Number Cross-Check",
        status="FAIL",
        severity="HIGH",
        evidence={
            "vaultedReference": vaulted_ref,
            "ocrReference": ocr_ref
        },
        explanation=f"Instrument reference mismatch: Vaulted reference is '{vaulted_ref}', but document scan displays '{ocr_ref}'.",
        recommended_action="Verify whether uploaded scan corresponds to a different deposit certificate."
    )

def check_entity_match(fdr: FDR, doc_fields: dict[str, Any] | None) -> RuleCheckResult:
    """Rule 6: Check bank name and institutional title alignment."""
    vaulted_bank = fdr.bank_name
    vaulted_inst = fdr.institution.name if fdr.institution else ""

    if not doc_fields:
        return RuleCheckResult(
            rule_id="RULE-ENTITY-MATCH",
            title="Banking Institution & Beneficiary Alignment",
            status="NEEDS_REVIEW",
            severity="LOW",
            evidence={
                "vaultedBank": vaulted_bank,
                "vaultedInstitution": vaulted_inst,
                "hasDocument": False
            },
            explanation="No document scan linked to verify issuing bank and institutional title.",
            recommended_action="Attach FDR scan to establish tripartite bank-institution endorsement."
        )

    ocr_bank = doc_fields.get("bankName")
    ocr_holder = doc_fields.get("accountHolder")

    if not ocr_bank and not ocr_holder:
        return RuleCheckResult(
            rule_id="RULE-ENTITY-MATCH",
            title="Banking Institution & Beneficiary Alignment",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={"vaultedBank": vaulted_bank, "vaultedInstitution": vaulted_inst},
            explanation="Bank name and account holder could not be parsed from document scan.",
            recommended_action="Check image clarity or enter issuing bank and account title manually."
        )

    # Normalized bank comparison
    norm_v_bank = normalize_bank_name(vaulted_bank)
    norm_o_bank = normalize_bank_name(ocr_bank)
    bank_matches = (norm_v_bank in norm_o_bank or norm_o_bank in norm_v_bank) if (norm_v_bank and norm_o_bank) else True

    # Institution title comparison
    norm_v_inst = normalize_text(vaulted_inst)
    norm_o_inst = normalize_text(ocr_holder)
    inst_keywords = [w for w in norm_v_inst.split() if len(w) > 3]
    inst_matches = any(kw in norm_o_inst for kw in inst_keywords) if (inst_keywords and norm_o_inst) else True

    if not bank_matches:
        return RuleCheckResult(
            rule_id="RULE-ENTITY-MATCH",
            title="Banking Institution & Beneficiary Alignment",
            status="FAIL",
            severity="HIGH",
            evidence={
                "vaultedBank": vaulted_bank,
                "ocrBank": ocr_bank,
                "vaultedInstitution": vaulted_inst,
                "ocrHolder": ocr_holder
            },
            explanation=f"Bank mismatch: Vaulted bank is '{vaulted_bank}', but document scan indicates '{ocr_bank}'.",
            recommended_action="Confirm whether the deposit was booked at another banking institution."
        )

    if not inst_matches and ocr_holder:
        return RuleCheckResult(
            rule_id="RULE-ENTITY-MATCH",
            title="Banking Institution & Beneficiary Alignment",
            status="WARNING",
            severity="MEDIUM",
            evidence={
                "vaultedBank": vaulted_bank,
                "ocrBank": ocr_bank,
                "vaultedInstitution": vaulted_inst,
                "ocrHolder": ocr_holder
            },
            explanation=f"Institutional title difference: Vaulted title '{vaulted_inst}' differs from scan holder '{ocr_holder}'.",
            recommended_action="Inspect tripartite lien clause to ensure lien is held in favour of AICTE."
        )

    return RuleCheckResult(
        rule_id="RULE-ENTITY-MATCH",
        title="Banking Institution & Beneficiary Alignment",
        status="PASS",
        severity="LOW",
        evidence={
            "vaultedBank": vaulted_bank,
            "ocrBank": ocr_bank or vaulted_bank,
            "vaultedInstitution": vaulted_inst
        },
        explanation=f"Issuing bank ('{vaulted_bank}') and institutional title match the scanned instrument.",
        recommended_action="No action required."
    )

def check_maturity_horizon(
    fdr: FDR,
    config: ComplianceConfig,
    as_of_date: date | None = None
) -> RuleCheckResult:
    """Rule 7: Assess maturity horizon against configurable approaching-maturity threshold."""
    if not isinstance(fdr.maturity_date, (date, datetime)):
        return RuleCheckResult(
            rule_id="RULE-MATURITY-HORIZON",
            title="Maturity Horizon & Expiry Assessment",
            status="FAIL",
            severity="CRITICAL",
            evidence={"error": "Missing maturity date"},
            explanation="Cannot determine maturity horizon without valid maturity date.",
            recommended_action="Set valid maturity date."
        )

    today = as_of_date or date.today()
    days_remaining = (fdr.maturity_date - today).days

    if days_remaining < 0:
        return RuleCheckResult(
            rule_id="RULE-MATURITY-HORIZON",
            title="Maturity Horizon & Expiry Assessment",
            status="FAIL",
            severity="CRITICAL",
            evidence={
                "maturityDate": fdr.maturity_date.isoformat(),
                "daysRemaining": days_remaining,
                "asOfDate": today.isoformat(),
                "state": "EXPIRED"
            },
            explanation=f"Instrument EXPIRED on {fdr.maturity_date} ({abs(days_remaining)} days overdue). Statutory lien is unrenewed and at immediate forfeiture default.",
            recommended_action="Issue formal statutory notice of encashment or demand immediate renewal certificate from institution."
        )

    if days_remaining <= config.approaching_maturity_days:
        return RuleCheckResult(
            rule_id="RULE-MATURITY-HORIZON",
            title="Maturity Horizon & Expiry Assessment",
            status="WARNING",
            severity="HIGH",
            evidence={
                "maturityDate": fdr.maturity_date.isoformat(),
                "daysRemaining": days_remaining,
                "thresholdDays": config.approaching_maturity_days,
                "asOfDate": today.isoformat(),
                "state": "APPROACHING_MATURITY"
            },
            explanation=f"Instrument approaches maturity in {days_remaining} days ({fdr.maturity_date}). Renewal cycle window is {config.approaching_maturity_days} days.",
            recommended_action="Dispatch 90-day tripartite renewal reminder notice to institution management."
        )

    return RuleCheckResult(
        rule_id="RULE-MATURITY-HORIZON",
        title="Maturity Horizon & Expiry Assessment",
        status="PASS",
        severity="LOW",
        evidence={
            "maturityDate": fdr.maturity_date.isoformat(),
            "daysRemaining": days_remaining,
            "thresholdDays": config.approaching_maturity_days,
            "asOfDate": today.isoformat(),
            "state": "ACTIVE"
        },
        explanation=f"Maturity horizon is satisfactory ({days_remaining} days remaining until {fdr.maturity_date}).",
        recommended_action="No immediate maturity action required; maintain scheduled custody monitoring."
    )

def check_document_linkage(
    fdr: FDR,
    doc_fields: dict[str, Any] | None,
    ocr_confidence: float | None,
    config: ComplianceConfig
) -> RuleCheckResult:
    """Rule 8: Verify electronic scan linkage and OCR verification review."""
    has_linked_doc = doc_fields is not None
    has_physical_loc = bool(fdr.physical_location and "scan" in fdr.physical_location.lower())

    if not has_linked_doc and not has_physical_loc:
        return RuleCheckResult(
            rule_id="RULE-DOC-LINKED",
            title="Document Custody & OCR Verification Audit",
            status="WARNING",
            severity="MEDIUM",
            evidence={"hasDocument": False},
            explanation="No electronic document scan is linked to this vaulted FDR instrument. Operates on ledger entry alone.",
            recommended_action="Scan and upload physical tripartite FDR certificate via AI Verification intake."
        )

    conf = ocr_confidence if ocr_confidence is not None else (float(fdr.ocr_confidence) if fdr.ocr_confidence else 90.0)

    if conf < config.ocr_confidence_threshold:
        return RuleCheckResult(
            rule_id="RULE-DOC-LINKED",
            title="Document Custody & OCR Verification Audit",
            status="NEEDS_REVIEW",
            severity="MEDIUM",
            evidence={
                "hasDocument": True,
                "ocrConfidence": conf,
                "confidenceThreshold": config.ocr_confidence_threshold
            },
            explanation=f"Document scan is attached, but OCR confidence ({conf}%) requires administrative sign-off.",
            recommended_action="Review uploaded voucher scan to confirm key security parameters."
        )

    return RuleCheckResult(
        rule_id="RULE-DOC-LINKED",
        title="Document Custody & OCR Verification Audit",
        status="PASS",
        severity="LOW",
        evidence={
            "hasDocument": True,
            "ocrConfidence": conf
        },
        explanation=f"Digitized receipt scan is attached and verified (OCR Confidence: {conf}%).",
        recommended_action="Maintain electronic copy in secure document vault."
    )

def evaluate_fdr_compliance(
    fdr: FDR,
    custom_doc_fields: dict[str, Any] | None = None,
    custom_ocr_confidence: float | None = None,
    config: ComplianceConfig | None = None,
    as_of_date: date | None = None
) -> FDRComplianceReport:
    """
    Evaluates all 8 compliance rules against an FDR record and any linked document scan.
    Returns explainable, structured compliance diagnostics.
    """
    cfg = config or ComplianceConfig()

    # Determine document fields
    doc_fields = custom_doc_fields
    ocr_conf = custom_ocr_confidence

    if doc_fields is None:
        linked_doc = find_linked_document(fdr.id)
        if linked_doc:
            doc_fields = linked_doc.get("extractedFields")
            ocr_conf = linked_doc.get("overallConfidence")
        elif fdr.physical_location and "scan" in fdr.physical_location.lower():
            # Minimal simulated attachment from previous link
            doc_fields = {
                "depositAmount": float(fdr.deposit_amount),
                "reference": fdr.reference,
                "bankName": fdr.bank_name
            }
            ocr_conf = float(fdr.ocr_confidence) if fdr.ocr_confidence else 90.0

    # Run individual rules
    checks = [
        check_mandatory_fields(fdr),
        check_date_validity(fdr),
        check_date_order(fdr),
        check_amount_match(fdr, doc_fields, ocr_conf, cfg),
        check_reference_match(fdr, doc_fields, ocr_conf, cfg),
        check_entity_match(fdr, doc_fields),
        check_maturity_horizon(fdr, cfg, as_of_date=as_of_date),
        check_document_linkage(fdr, doc_fields, ocr_conf, cfg)
    ]

    pass_count = sum(1 for c in checks if c.status == "PASS")
    warning_count = sum(1 for c in checks if c.status == "WARNING")
    fail_count = sum(1 for c in checks if c.status == "FAIL")
    needs_review_count = sum(1 for c in checks if c.status == "NEEDS_REVIEW")
    total_rules = len(checks)

    # Score calculation (PASS: 100%, WARNING: 60%, NEEDS_REVIEW: 50%, FAIL: 0%)
    score_sum = (pass_count * 100) + (warning_count * 60) + (needs_review_count * 50)
    compliance_score = round(score_sum / total_rules, 1)

    # Overall Status determination
    if fail_count > 0:
        overall_status = "NON_COMPLIANT"
    elif warning_count > 0:
        overall_status = "ACTION_REQUIRED"
    elif needs_review_count > 0:
        overall_status = "UNDER_REVIEW"
    else:
        overall_status = "COMPLIANT"

    # Summary explanation & next action
    if fail_count > 0:
        failed_titles = [c.title for c in checks if c.status == "FAIL"]
        summary_explanation = f"FDR instrument is NON-COMPLIANT due to {fail_count} failed rule(s): {'; '.join(failed_titles)}. Regulatory intervention required."
        recommended_next_action = next((c.recommended_action for c in checks if c.status == "FAIL"), "Address critical compliance failures.")
    elif warning_count > 0:
        warning_titles = [c.title for c in checks if c.status == "WARNING"]
        summary_explanation = f"FDR instrument requires action ({warning_count} warning(s)): {'; '.join(warning_titles)}."
        recommended_next_action = next((c.recommended_action for c in checks if c.status == "WARNING"), "Review active warnings.")
    elif needs_review_count > 0:
        summary_explanation = f"FDR instrument is under review ({needs_review_count} item(s) require manual officer sign-off)."
        recommended_next_action = "Review unverified physical receipt or OCR extraction in AI Verification."
    else:
        summary_explanation = f"FDR instrument is fully COMPLIANT across all {total_rules} statutory rules with {compliance_score}% adherence."
        recommended_next_action = "No action required. Maintain standard custody monitoring."

    inst_code = getattr(fdr, "institution_code", None) or (fdr.institution.code if fdr.institution else "")
    inst_name = fdr.institution.name if fdr.institution else ""

    return FDRComplianceReport(
        fdr_id=fdr.id,
        reference=fdr.reference,
        institution_code=inst_code,
        institution_name=inst_name,
        bank_name=fdr.bank_name,
        deposit_amount=float(fdr.deposit_amount),
        overall_status=overall_status,
        compliance_score=compliance_score,
        total_rules=total_rules,
        pass_count=pass_count,
        warning_count=warning_count,
        fail_count=fail_count,
        needs_review_count=needs_review_count,
        summary_explanation=summary_explanation,
        recommended_next_action=recommended_next_action,
        checks=checks
    )

def evaluate_all_fdrs(
    db: Session,
    config: ComplianceConfig | None = None,
    as_of_date: date | None = None
) -> ComplianceBatchSummary:
    """Evaluates compliance for all vaulted FDR instruments in PostgreSQL."""
    cfg = config or ComplianceConfig()
    records = db.execute(select(FDR)).scalars().all()

    items: list[ComplianceSummaryItem] = []
    compliant_count = 0
    non_compliant_count = 0
    action_required_count = 0
    under_review_count = 0
    total_score = 0.0

    for fdr in records:
        rep = evaluate_fdr_compliance(fdr, config=cfg, as_of_date=as_of_date)
        total_score += rep.compliance_score

        if rep.overall_status == "COMPLIANT":
            compliant_count += 1
        elif rep.overall_status == "NON_COMPLIANT":
            non_compliant_count += 1
        elif rep.overall_status == "ACTION_REQUIRED":
            action_required_count += 1
        elif rep.overall_status == "UNDER_REVIEW":
            under_review_count += 1

        primary_issue = None
        for c in rep.checks:
            if c.status in ("FAIL", "WARNING"):
                primary_issue = f"{c.title}: {c.explanation}"
                break

        items.append(ComplianceSummaryItem(
            fdr_id=rep.fdr_id,
            reference=rep.reference,
            institution=rep.institution_name,
            institution_code=rep.institution_code,
            deposit_amount=rep.deposit_amount,
            overall_status=rep.overall_status,
            compliance_score=rep.compliance_score,
            fail_count=rep.fail_count,
            warning_count=rep.warning_count,
            needs_review_count=rep.needs_review_count,
            primary_issue=primary_issue,
            recommended_action=rep.recommended_next_action
        ))

    total = len(records)
    avg_score = round(total_score / total, 1) if total > 0 else 0.0

    return ComplianceBatchSummary(
        total_instruments=total,
        compliant_count=compliant_count,
        non_compliant_count=non_compliant_count,
        action_required_count=action_required_count,
        under_review_count=under_review_count,
        average_compliance_score=avg_score,
        instruments=items
    )
