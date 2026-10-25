from datetime import date, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.compliance import ComplianceConfig
from app.services import compliance_service

client = TestClient(app)

def create_mock_fdr(
    reference="FDR-TEST-001",
    bank_name="State Bank of India",
    branch="Main Branch",
    ifsc="SBIN0001823",
    deposit_amount=Decimal("3500000.00"),
    issue_date=date(2024, 1, 1),
    maturity_date=date(2029, 1, 1),
    ocr_confidence=Decimal("95.0")
) -> FDR:
    """Helper to generate a realistic mock FDR record."""
    inst = Institution(
        id="INST-MOCK-001",
        name="Sardar Patel Institute of Technology",
        code="SPIT-MH-019",
        state="Maharashtra"
    )
    fdr = FDR(
        id="FDR-MOCK-001",
        reference=reference,
        institution_id=inst.id,
        bank_name=bank_name,
        branch=branch,
        ifsc=ifsc,
        deposit_amount=deposit_amount,
        issue_date=issue_date,
        maturity_date=maturity_date,
        verification_status="Pending",
        priority="Standard",
        ocr_confidence=ocr_confidence,
        physical_location="Vault Tray 01 / Linked to scan: test.pdf"
    )
    fdr.institution = inst
    return fdr

def test_rule_mandatory_fields_pass():
    """Verify that complete FDR passes mandatory fields rule."""
    fdr = create_mock_fdr()
    res = compliance_service.check_mandatory_fields(fdr)
    assert res.status == "PASS"
    assert res.rule_id == "RULE-REQ-FIELDS"
    assert res.evidence["missingCount"] == 0

def test_rule_mandatory_fields_fail():
    """Verify that an FDR missing branch or ifsc fails mandatory fields rule."""
    fdr = create_mock_fdr(branch="")
    res = compliance_service.check_mandatory_fields(fdr)
    assert res.status == "FAIL"
    assert "branch" in res.evidence["missingFields"]
    assert "Missing mandatory regulatory fields" in res.explanation

def test_rule_date_validity():
    """Verify date validity check handles valid and invalid date objects."""
    fdr = create_mock_fdr()
    res = compliance_service.check_date_validity(fdr)
    assert res.status == "PASS"

    fdr_broken = create_mock_fdr()
    fdr_broken.maturity_date = None
    res_broken = compliance_service.check_date_validity(fdr_broken)
    assert res_broken.status == "FAIL"

def test_rule_date_order_and_boundaries():
    """Verify chronological sequence: valid tenure, 0-day tenure, and negative tenure."""
    # 1. Normal term
    fdr = create_mock_fdr(issue_date=date(2024, 1, 1), maturity_date=date(2029, 1, 1))
    res = compliance_service.check_date_order(fdr)
    assert res.status == "PASS"
    assert res.evidence["termDays"] > 0

    # 2. Boundary: same day (0 days)
    fdr_same = create_mock_fdr(issue_date=date(2024, 1, 1), maturity_date=date(2024, 1, 1))
    res_same = compliance_service.check_date_order(fdr_same)
    assert res_same.status == "WARNING"
    assert res_same.evidence["termDays"] == 0

    # 3. Maturity before issue (negative days)
    fdr_inv = create_mock_fdr(issue_date=date(2024, 1, 1), maturity_date=date(2023, 1, 1))
    res_inv = compliance_service.check_date_order(fdr_inv)
    assert res_inv.status == "FAIL"
    assert res_inv.evidence["termDays"] < 0

def test_rule_amount_match_exact_and_discrepancy():
    """Verify amount check: exact match, tolerance match, and discrepancy failure."""
    cfg = ComplianceConfig(amount_tolerance=1.0)
    fdr = create_mock_fdr(deposit_amount=Decimal("3500000.00"))

    # Exact match
    res_exact = compliance_service.check_amount_match(fdr, {"depositAmount": 3500000.00}, 95.0, cfg)
    assert res_exact.status == "PASS"
    assert res_exact.evidence["delta"] == 0.0

    # Within tolerance
    res_tol = compliance_service.check_amount_match(fdr, {"depositAmount": 3500000.50}, 95.0, cfg)
    assert res_tol.status == "PASS"

    # Beyond tolerance -> FAIL
    res_fail = compliance_service.check_amount_match(fdr, {"depositAmount": 3000000.00}, 95.0, cfg)
    assert res_fail.status == "FAIL"
    assert res_fail.evidence["delta"] == 500000.0
    assert "Discrepancy detected" in res_fail.explanation

def test_rule_amount_ocr_uncertainty_gives_needs_review():
    """Verify that low OCR confidence does not trigger a false FAIL, but yields NEEDS_REVIEW."""
    cfg = ComplianceConfig(amount_tolerance=1.0, ocr_confidence_threshold=75.0)
    fdr = create_mock_fdr(deposit_amount=Decimal("3500000.00"))

    # Low confidence OCR (e.g. 60%) with mismatched number
    res_low_conf = compliance_service.check_amount_match(fdr, {"depositAmount": 2800000.00}, 60.0, cfg)
    assert res_low_conf.status == "NEEDS_REVIEW"
    assert "below" in res_low_conf.explanation.lower()

def test_rule_reference_match():
    """Verify FDR reference cross-check."""
    cfg = ComplianceConfig(ocr_confidence_threshold=75.0)
    fdr = create_mock_fdr(reference="FDR-AICTE-2024-9102")

    # Match
    res_pass = compliance_service.check_reference_match(fdr, {"reference": "FDR-AICTE-2024-9102"}, 95.0, cfg)
    assert res_pass.status == "PASS"

    # Mismatch
    res_fail = compliance_service.check_reference_match(fdr, {"reference": "FDR-DIFFERENT-9999"}, 95.0, cfg)
    assert res_fail.status == "FAIL"

    # Missing OCR reference
    res_none = compliance_service.check_reference_match(fdr, {}, 95.0, cfg)
    assert res_none.status == "NEEDS_REVIEW"

def test_rule_entity_match():
    """Verify banking institution and beneficiary cross-check."""
    fdr = create_mock_fdr(bank_name="State Bank of India")

    # Match
    res_pass = compliance_service.check_entity_match(fdr, {
        "bankName": "State Bank of India",
        "accountHolder": "Sardar Patel Institute of Technology"
    })
    assert res_pass.status == "PASS"

    # Bank mismatch
    res_fail = compliance_service.check_entity_match(fdr, {
        "bankName": "Punjab National Bank",
        "accountHolder": "Sardar Patel Institute of Technology"
    })
    assert res_fail.status == "FAIL"

def test_rule_maturity_horizon_boundaries():
    """Verify expired, approaching maturity, and active status at exact boundary dates."""
    cfg = ComplianceConfig(approaching_maturity_days=90)
    as_of = date(2026, 10, 25)

    # 1. Expired (1 day past)
    fdr_exp = create_mock_fdr(maturity_date=as_of - timedelta(days=1))
    res_exp = compliance_service.check_maturity_horizon(fdr_exp, cfg, as_of_date=as_of)
    assert res_exp.status == "FAIL"
    assert "EXPIRED" in res_exp.evidence["state"]

    # 2. Approaching maturity (exact 90 days boundary)
    fdr_appr = create_mock_fdr(maturity_date=as_of + timedelta(days=90))
    res_appr = compliance_service.check_maturity_horizon(fdr_appr, cfg, as_of_date=as_of)
    assert res_appr.status == "WARNING"
    assert "APPROACHING_MATURITY" in res_appr.evidence["state"]

    # 3. Active / satisfactory horizon (91 days)
    fdr_act = create_mock_fdr(maturity_date=as_of + timedelta(days=91))
    res_act = compliance_service.check_maturity_horizon(fdr_act, cfg, as_of_date=as_of)
    assert res_act.status == "PASS"
    assert "ACTIVE" in res_act.evidence["state"]

def test_multiple_simultaneous_failures_aggregation():
    """Verify that multiple simultaneous failures aggregate to NON_COMPLIANT without hiding checks."""
    as_of = date(2026, 10, 25)
    cfg = ComplianceConfig(approaching_maturity_days=90)

    # Broken FDR: missing branch, expired, amount mismatch, ref mismatch
    fdr = create_mock_fdr(
        branch="",
        deposit_amount=Decimal("3500000.00"),
        reference="FDR-REAL-001",
        maturity_date=as_of - timedelta(days=10)  # Expired
    )
    doc_fields = {
        "depositAmount": 2000000.00,  # Mismatch
        "reference": "FDR-WRONG-999"   # Mismatch
    }

    report = compliance_service.evaluate_fdr_compliance(
        fdr=fdr,
        custom_doc_fields=doc_fields,
        custom_ocr_confidence=95.0,
        config=cfg,
        as_of_date=as_of
    )

    assert report.overall_status == "NON_COMPLIANT"
    assert report.fail_count >= 3
    assert len(report.checks) == 8
    # Ensure individual failed rules are clearly present
    failed_rule_ids = [c.rule_id for c in report.checks if c.status == "FAIL"]
    assert "RULE-REQ-FIELDS" in failed_rule_ids
    assert "RULE-AMOUNT-MATCH" in failed_rule_ids
    assert "RULE-REF-MATCH" in failed_rule_ids
    assert "RULE-MATURITY-HORIZON" in failed_rule_ids

def test_api_compliance_endpoints():
    """Verify API integration for summary, individual FDR, and custom evaluation."""
    # 1. Summary
    res_summary = client.get("/api/compliance/summary?approaching_maturity_days=90")
    assert res_summary.status_code == 200
    sum_data = res_summary.json()
    assert sum_data["totalInstruments"] >= 10
    assert "instruments" in sum_data
    assert len(sum_data["instruments"]) >= 10

    # 2. Individual FDR
    first_fdr_id = sum_data["instruments"][0]["fdrId"]
    res_fdr = client.get(f"/api/compliance/fdr/{first_fdr_id}")
    assert res_fdr.status_code == 200
    fdr_data = res_fdr.json()
    assert fdr_data["fdrId"] == first_fdr_id
    assert len(fdr_data["checks"]) == 8
    assert "STATUTORY NOTICE" in fdr_data["disclaimer"]

    # 3. Custom Evaluation endpoint
    res_custom = client.post(
        "/api/compliance/evaluate-custom",
        json={
            "fdrId": first_fdr_id,
            "ocrExtractedFields": {
                "depositAmount": 3500000.0,
                "reference": "FDR-MATCH-TEST",
                "bankName": "State Bank of India"
            },
            "ocrConfidence": 92.0
        }
    )
    assert res_custom.status_code == 200
    custom_data = res_custom.json()
    assert len(custom_data["checks"]) == 8
