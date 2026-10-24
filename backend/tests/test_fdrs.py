import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_fdrs():
    res = client.get("/api/fdrs")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    first = data[0]
    assert "reference" in first
    assert "depositAmount" in first
    assert "bankName" in first
    assert "branch" in first
    assert "ifsc" in first
    assert "institution" in first
    assert "institutionCode" in first

def test_get_fdr_by_id():
    res = client.get("/api/fdrs/FDR-2024-9102")
    assert res.status_code == 200
    fdr = res.json()
    assert fdr["reference"] == "FDR-AICTE-2024-9102"
    assert fdr["institutionCode"] == "SPIT-MH-019"
    assert fdr["bankName"] == "State Bank of India"
    assert fdr["branch"] == "Andheri West, Mumbai"
    assert fdr["ifsc"] == "SBIN0001823"
    assert fdr["depositAmount"] == 3500000.0

def test_fdr_search_and_filters():
    # Filter by bank
    res_bank = client.get("/api/fdrs?bank=State+Bank+of+India")
    assert res_bank.status_code == 200
    assert all("State Bank of India" in f["bankName"] for f in res_bank.json())

    # Filter by status
    res_status = client.get("/api/fdrs?status=Verified")
    assert res_status.status_code == 200
    assert all(f["verificationStatus"] == "Verified" for f in res_status.json())

    # Search by IFSC
    res_ifsc = client.get("/api/fdrs?search=SBIN0001823")
    assert res_ifsc.status_code == 200
    assert any(f["reference"] == "FDR-AICTE-2024-9102" for f in res_ifsc.json())

import uuid

def test_create_update_delete_fdr():
    unique_ref = f"FDR-TEST-{uuid.uuid4().hex[:8].upper()}"
    new_fdr_payload = {
        "reference": unique_ref,
        "institutionCode": "SPIT-MH-019",
        "bankName": "Bank of Baroda",
        "branch": "Nariman Point Branch",
        "ifsc": "BARB0NARIMA",
        "certificateNo": "BOB-TEST-88120",
        "depositAmount": 2500000.0,
        "currency": "INR",
        "interestRate": "7.25%",
        "issueDate": "2026-01-15",
        "maturityDate": "2031-01-15",
        "verificationStatus": "Pending",
        "priority": "Standard",
        "jointLienHolder": "Member Secretary AICTE & Principal SPIT",
        "lienStatus": "Lien Marked to AICTE New Delhi",
        "ocrConfidence": 96.5,
        "physicalLocation": "Vault 03 / Shelf A-01"
    }

    # 1. Create
    res = client.post("/api/fdrs", json=new_fdr_payload)
    assert res.status_code == 201
    created = res.json()
    assert created["reference"] == unique_ref
    assert created["institution"] == "Sardar Patel Institute of Technology"
    assert created["branch"] == "Nariman Point Branch"
    assert created["ifsc"] == "BARB0NARIMA"
    fdr_id = created["id"]

    try:
        # 2. Duplicate reference rejected
        res_dup = client.post("/api/fdrs", json=new_fdr_payload)
        assert res_dup.status_code == 409

        # 3. Update
        res_update = client.patch(f"/api/fdrs/{fdr_id}", json={
            "verificationStatus": "Verified",
            "depositAmount": 2600000.0
        })
        assert res_update.status_code == 200
        assert res_update.json()["verificationStatus"] == "Verified"
        assert res_update.json()["depositAmount"] == 2600000.0
    finally:
        # 4. Clean up / Delete
        client.delete(f"/api/fdrs/{fdr_id}")

def test_fdr_validation_errors():
    # Negative deposit amount
    bad_amount = {
        "reference": "FDR-INVALID-001",
        "institutionCode": "SPIT-MH-019",
        "bankName": "SBI",
        "branch": "Main",
        "ifsc": "SBIN0001823",
        "depositAmount": -5000,
        "issueDate": "2026-01-01",
        "maturityDate": "2030-01-01"
    }
    assert client.post("/api/fdrs", json=bad_amount).status_code == 422

    # Maturity date before issue date
    bad_dates = {
        "reference": "FDR-INVALID-002",
        "institutionCode": "SPIT-MH-019",
        "bankName": "SBI",
        "branch": "Main",
        "ifsc": "SBIN0001823",
        "depositAmount": 100000,
        "issueDate": "2026-05-01",
        "maturityDate": "2025-05-01"
    }
    assert client.post("/api/fdrs", json=bad_dates).status_code == 422

    # Invalid IFSC
    bad_ifsc = {
        "reference": "FDR-INVALID-003",
        "institutionCode": "SPIT-MH-019",
        "bankName": "SBI",
        "branch": "Main",
        "ifsc": "INVALID_IFSC_CODE",
        "depositAmount": 100000,
        "issueDate": "2026-01-01",
        "maturityDate": "2030-01-01"
    }
    assert client.post("/api/fdrs", json=bad_ifsc).status_code == 422
