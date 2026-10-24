import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["totalFdrs"] >= 10
    assert summary["totalDepositAmount"] >= 48500000.0
    assert summary["expiringSoonCount"] >= 1
    assert summary["pendingVerificationCount"] >= 1
    assert summary["overdueCount"] >= 1

def test_dashboard_status_distribution():
    res = client.get("/api/dashboard/status-distribution")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    names = [i["name"] for i in items]
    assert "Verified" in names
    assert "Pending" in names
    assert "Discrepancy" in names
    assert "Expiring Soon" in names

    # Total percentage should be ~100%
    total_pct = sum(i["percentage"] for i in items)
    assert 99.0 <= total_pct <= 101.0

def test_dashboard_upcoming_maturities():
    res = client.get("/api/dashboard/upcoming-maturities")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) > 0
    first = items[0]
    assert "month" in first
    assert "count" in first
    assert "amountInLakhs" in first
    assert "label" in first
