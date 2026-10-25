from datetime import date, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.risk import MaturityCategory, RiskPriority
from app.services.risk_service import (
    calculate_maturity_category,
    evaluate_fdr_risk,
    evaluate_all_fdrs_risk
)

client = TestClient(app)

def test_maturity_category_boundaries():
    today = date(2026, 10, 25)

    # 1. Past dates -> EXPIRED
    cat, days = calculate_maturity_category(today - timedelta(days=1), as_of=today)
    assert cat == MaturityCategory.EXPIRED
    assert days == -1

    cat, days = calculate_maturity_category(today - timedelta(days=50), as_of=today)
    assert cat == MaturityCategory.EXPIRED
    assert days == -50

    # 2. Boundary: Today (0 days remaining) must NOT be expired -> MATURING_30_DAYS
    cat, days = calculate_maturity_category(today, as_of=today)
    assert cat == MaturityCategory.MATURING_30_DAYS
    assert days == 0

    # 3. 1 day away -> MATURING_30_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=1), as_of=today)
    assert cat == MaturityCategory.MATURING_30_DAYS
    assert days == 1

    # 4. Boundary: Exactly 30 days -> MATURING_30_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=30), as_of=today)
    assert cat == MaturityCategory.MATURING_30_DAYS
    assert days == 30

    # 5. Boundary: Exactly 31 days -> MATURING_60_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=31), as_of=today)
    assert cat == MaturityCategory.MATURING_60_DAYS
    assert days == 31

    # 6. Boundary: Exactly 60 days -> MATURING_60_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=60), as_of=today)
    assert cat == MaturityCategory.MATURING_60_DAYS
    assert days == 60

    # 7. Boundary: Exactly 61 days -> MATURING_90_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=61), as_of=today)
    assert cat == MaturityCategory.MATURING_90_DAYS
    assert days == 61

    # 8. Boundary: Exactly 90 days -> MATURING_90_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=90), as_of=today)
    assert cat == MaturityCategory.MATURING_90_DAYS
    assert days == 90

    # 9. Boundary: Exactly 91 days -> BEYOND_90_DAYS
    cat, days = calculate_maturity_category(today + timedelta(days=91), as_of=today)
    assert cat == MaturityCategory.BEYOND_90_DAYS
    assert days == 91

    # 10. Long term (> 90 days)
    cat, days = calculate_maturity_category(today + timedelta(days=365), as_of=today)
    assert cat == MaturityCategory.BEYOND_90_DAYS
    assert days == 365

def test_maturity_category_missing_and_invalid_dates():
    today = date(2026, 10, 25)

    # Missing None
    cat, days = calculate_maturity_category(None, as_of=today)
    assert cat == MaturityCategory.UNKNOWN
    assert days is None

    # Invalid string
    cat, days = calculate_maturity_category("invalid-date-format", as_of=today)
    assert cat == MaturityCategory.UNKNOWN
    assert days is None

    # Valid string parsing
    cat, days = calculate_maturity_category("2026-11-24", as_of=today)
    assert cat == MaturityCategory.MATURING_30_DAYS
    assert days == 30

def test_risk_prioritization_expired_instrument():
    today = date(2026, 10, 25)
    inst = Institution(id="INST-01", code="INST-01", name="Test Engineering College")
    fdr = FDR(
        id="TEST-FDR-EXP",
        reference="FDR-AICTE-EXP-01",
        institution_id="INST-01",
        institution=inst,
        bank_name="State Bank of India",
        branch="Main Branch",
        ifsc="SBIN0001234",
        certificate_no="CERT-111",
        deposit_amount=Decimal("5000000.00"),
        issue_date=date(2023, 1, 1),
        maturity_date=date(2026, 10, 10), # 15 days ago
        verification_status="Discrepancy"
    )
    assessment = evaluate_fdr_risk(fdr, as_of=today)

    assert assessment.maturity_category == MaturityCategory.EXPIRED
    assert assessment.days_remaining == -15
    assert assessment.priority == RiskPriority.CRITICAL
    assert any(f.factor_code == "FACTOR-EXPIRED" for f in assessment.risk_factors)
    assert "CRITICAL" in assessment.explanation
    assert assessment.priority_score >= 80.0

def test_risk_prioritization_imminent_maturity():
    today = date(2026, 10, 25)
    inst = Institution(id="INST-01", code="INST-01", name="Test Engineering College")
    fdr = FDR(
        id="TEST-FDR-IMM",
        reference="FDR-AICTE-IMM-02",
        institution_id="INST-01",
        institution=inst,
        bank_name="Punjab National Bank",
        branch="Civil Lines",
        ifsc="PUNB0001234",
        certificate_no="CERT-222",
        deposit_amount=Decimal("3500000.00"),
        issue_date=date(2024, 1, 1),
        maturity_date=date(2026, 11, 15), # 21 days away
        verification_status="Verified"
    )
    assessment = evaluate_fdr_risk(fdr, as_of=today)

    assert assessment.maturity_category == MaturityCategory.MATURING_30_DAYS
    assert assessment.days_remaining == 21
    assert assessment.priority == RiskPriority.HIGH
    assert any(f.factor_code == "FACTOR-IMMINENT-MATURITY" for f in assessment.risk_factors)
    assert "HIGH" in assessment.explanation

def test_risk_prioritization_safe_long_term():
    today = date(2026, 10, 25)
    inst = Institution(id="INST-01", code="INST-01", name="Test Engineering College")
    fdr = FDR(
        id="TEST-FDR-SAFE",
        reference="FDR-AICTE-SAFE-03",
        institution_id="INST-01",
        institution=inst,
        bank_name="HDFC Bank",
        branch="Sector 18",
        ifsc="HDFC0001234",
        certificate_no="CERT-333",
        deposit_amount=Decimal("7500000.00"),
        issue_date=date(2025, 1, 1),
        maturity_date=date(2028, 1, 1), # far in future (> 90 days)
        verification_status="Verified",
        physical_location="AICTE Central Vault - Scanned copy attached"
    )
    assessment = evaluate_fdr_risk(fdr, as_of=today)

    assert assessment.maturity_category == MaturityCategory.BEYOND_90_DAYS
    assert assessment.days_remaining > 400
    assert assessment.priority == RiskPriority.LOW
    assert assessment.priority_score < 40.0
    assert "LOW" in assessment.explanation

def test_multiple_simultaneous_risk_factors():
    today = date(2026, 10, 25)
    inst = Institution(id="INST-01", code="INST-01", name="Test Engineering College")
    # Expired + Discrepancy + Missing bank name
    fdr = FDR(
        id="TEST-FDR-MULTI",
        reference="FDR-AICTE-MULTI-04",
        institution_id="INST-01",
        institution=inst,
        bank_name="", # Missing mandatory field -> FAIL
        branch="Branch X",
        ifsc="SBIN0001111",
        certificate_no="CERT-444",
        deposit_amount=Decimal("10000000.00"),
        issue_date=date(2023, 1, 1),
        maturity_date=date(2026, 9, 1), # Expired
        verification_status="Discrepancy"
    )
    assessment = evaluate_fdr_risk(fdr, as_of=today)

    assert assessment.priority == RiskPriority.CRITICAL
    assert assessment.maturity_category == MaturityCategory.EXPIRED
    assert len(assessment.risk_factors) >= 2
    assert any(f.factor_code == "FACTOR-EXPIRED" for f in assessment.risk_factors)
    assert any("FACTOR-RULE-REQ-FIELDS" in f.factor_code for f in assessment.risk_factors)

def test_api_risk_summary_endpoint():
    res = client.get("/api/risk/summary")
    assert res.status_code == 200
    data = res.json()

    assert data["totalInstruments"] >= 10
    assert data["totalDepositCorpus"] >= 48500000.0
    assert "criticalCount" in data
    assert "highCount" in data
    assert "mediumCount" in data
    assert "lowCount" in data
    assert "expiredCount" in data
    assert "maturing30Count" in data
    assert len(data["priorityBreakdown"]) == 4
    assert len(data["maturityBreakdown"]) == 6
    assert len(data["prioritizedQueue"]) >= 10

    # Ensure queue is ordered by priority (Critical first)
    first_item = data["prioritizedQueue"][0]
    assert first_item["priority"] in ["CRITICAL", "HIGH"]

def test_api_risk_prioritized_with_filters():
    # Filter by CRITICAL
    res = client.get("/api/risk/prioritized?priority=CRITICAL")
    assert res.status_code == 200
    items = res.json()
    assert all(item["priority"] == "CRITICAL" for item in items)

    # Filter by EXPIRED
    res_exp = client.get("/api/risk/prioritized?maturity=EXPIRED")
    assert res_exp.status_code == 200
    items_exp = res_exp.json()
    assert all(item["maturityCategory"] == "EXPIRED" for item in items_exp)

def test_api_fdr_risk_assessment_detail_and_404():
    # First get an existing FDR id
    res_summary = client.get("/api/risk/summary")
    fdr_id = res_summary.json()["prioritizedQueue"][0]["fdrId"]

    # Valid FDR ID
    res = client.get(f"/api/risk/fdr/{fdr_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["fdrId"] == fdr_id
    assert "priority" in detail
    assert "maturityCategory" in detail
    assert "riskFactors" in detail
    assert "recommendedAction" in detail
    assert "explanation" in detail

    # Nonexistent FDR ID
    res_404 = client.get("/api/risk/fdr/NONEXISTENT-ID-999")
    assert res_404.status_code == 404
