import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_institutions():
    response = client.get("/api/institutions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    first = data[0]
    assert "code" in first
    assert "name" in first
    assert "fdrCount" in first
    assert "totalDeposit" in first

def test_get_institution_by_id():
    response = client.get("/api/institutions/INST-SPIT-MH-019")
    assert response.status_code == 200
    inst = response.json()
    assert inst["code"] == "SPIT-MH-019"
    assert inst["name"] == "Sardar Patel Institute of Technology"
    assert inst["fdrCount"] >= 1
    assert inst["totalDeposit"] >= 3500000

def test_get_nonexistent_institution():
    response = client.get("/api/institutions/INST-NON-EXISTENT-999")
    assert response.status_code == 404

def test_search_and_filter_institutions():
    # Search by code
    res = client.get("/api/institutions?search=SPIT")
    assert res.status_code == 200
    data = res.json()
    assert any(i["code"] == "SPIT-MH-019" for i in data)

    # Search by PIN code
    res_pin = client.get("/api/institutions?search=400058")
    assert res_pin.status_code == 200
    assert any(i["pincode"] == "400058" for i in res_pin.json())

    # Filter by state
    res_state = client.get("/api/institutions?state=Karnataka")
    assert res_state.status_code == 200
    assert all(i["state"] == "Karnataka" for i in res_state.json())

def test_create_and_delete_institution():
    new_inst_payload = {
        "name": "Bureau Test Institute of Advanced Computing",
        "code": "BTIAC-TEST-001",
        "pid": "1-999001",
        "type": "Technical Degree (UG/PG)",
        "pincode": "560001",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "Electronic City Phase 1",
        "trust": "AICTE Testing Trust",
        "contactPerson": "Prof. Test Administrator",
        "email": "admin@btiac.edu.in",
        "phone": "+91 80 9988 7766"
    }

    # 1. Create
    res = client.post("/api/institutions", json=new_inst_payload)
    assert res.status_code == 201
    created = res.json()
    assert created["code"] == "BTIAC-TEST-001"
    assert created["pincode"] == "560001"
    inst_id = created["id"]

    # 2. Duplicate code rejected
    res_dup = client.post("/api/institutions", json=new_inst_payload)
    assert res_dup.status_code == 409

    # 3. Update
    res_update = client.patch(f"/api/institutions/{inst_id}", json={
        "city": "Bangalore Urban",
        "contactPerson": "Dr. Updated Director"
    })
    assert res_update.status_code == 200
    assert res_update.json()["city"] == "Bangalore Urban"
    assert res_update.json()["contactPerson"] == "Dr. Updated Director"

    # 4. Delete (no linked FDRs, should succeed)
    res_del = client.delete(f"/api/institutions/{inst_id}")
    assert res_del.status_code == 200

def test_block_delete_institution_with_linked_fdrs():
    # Attempting to delete SPIT which has linked FDRs
    res = client.delete("/api/institutions/INST-SPIT-MH-019")
    assert res.status_code == 400
    assert "active FDR deposit lien" in res.json()["detail"]
