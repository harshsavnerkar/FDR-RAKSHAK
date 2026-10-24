import io
import fitz
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_sample_pdf(text_content: str) -> bytes:
    """Generates a valid in-memory PDF containing the given text."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text_content, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_ocr_engine_status():
    """Verify that OCR status endpoint returns engine capabilities and constraints."""
    res = client.get("/api/documents/status")
    assert res.status_code == 200
    data = res.json()
    assert "pdfEngineAvailable" in data
    assert "tesseractAvailable" in data
    assert "maxUploadSizeBytes" in data
    assert "allowedExtensions" in data
    assert ".pdf" in data["allowedExtensions"]
    assert ".png" in data["allowedExtensions"]

def test_upload_unsupported_file_type():
    """Verify that uploading an unsupported extension (e.g. .exe or .txt) returns 400."""
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    res = client.post(
        "/api/documents/upload",
        files={"file": ("malicious_payload.exe", fake_exe, "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_upload_empty_file():
    """Verify that uploading a 0-byte file returns 400."""
    empty = io.BytesIO(b"")
    res = client.post(
        "/api/documents/upload",
        files={"file": ("empty.pdf", empty, "application/pdf")}
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_upload_file_exceeding_size_limit(monkeypatch):
    """Verify that uploading a file larger than MAX_UPLOAD_SIZE_BYTES returns 413."""
    from app import config
    monkeypatch.setattr(config, "MAX_UPLOAD_SIZE_BYTES", 1024)
    from app.services import document_service
    monkeypatch.setattr(document_service, "MAX_UPLOAD_SIZE_BYTES", 1024)

    oversized = io.BytesIO(b"%PDF-1.4 " + b"X" * 2000)
    res = client.post(
        "/api/documents/upload",
        files={"file": ("large_doc.pdf", oversized, "application/pdf")}
    )
    assert res.status_code == 413
    assert "exceeds maximum allowable limit" in res.json()["detail"].lower()

def test_upload_malformed_document():
    """Verify that uploading a file with wrong magic bytes returns 422."""
    fake_pdf = io.BytesIO(b"THIS IS NOT A VALID PDF SIGNATURE")
    res = client.post(
        "/api/documents/upload",
        files={"file": ("corrupt.pdf", fake_pdf, "application/pdf")}
    )
    assert res.status_code == 422
    assert "header does not match expected signature" in res.json()["detail"].lower()

def test_successful_ocr_extraction_of_available_fields():
    """Verify that a clean FDR PDF extracts reference, bank, IFSC, amount, and dates."""
    sample_text = """
    STATE BANK OF INDIA
    Branch: Nariman Point, Mumbai | IFSC: SBIN0001823
    FIXED DEPOSIT RECEIPT / STDR
    FDR Reference No: FDR-AICTE-2026-TEST-777
    Certificate No: CERT-SBI-2024-9981

    In Favour Of: Test Institute of Technology
    Joint Lien: AICTE New Delhi

    Deposit Amount: Rs. 35,00,000.00
    Interest Rate: 7.10% p.a.
    Date of Issue: 15/01/2024
    Date of Maturity: 15/01/2029
    Maturity Amount: Rs. 49,52,500.00

    Lien Marked to AICTE New Delhi
    """
    pdf_bytes = create_sample_pdf(sample_text)
    res = client.post(
        "/api/documents/upload",
        files={"file": ("fdr_receipt_scan.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["documentId"] is not None
    assert data["originalFilename"] == "fdr_receipt_scan.pdf"
    assert "rawText" in data and len(data["rawText"]) > 0

    fields = data["extractedFields"]
    assert fields["reference"] == "FDR-AICTE-2026-TEST-777"
    assert fields["bankName"] == "State Bank of India"
    assert fields["ifsc"] == "SBIN0001823"
    assert fields["depositAmount"] == 3500000.0
    assert fields["issueDate"] == "2024-01-15"
    assert fields["maturityDate"] == "2029-01-15"
    assert fields["interestRate"] == "7.10%"
    assert fields["maturityAmount"] == 4952500.0
    assert data["isComplete"] is True
    assert "STATUTORY NOTICE" in data["disclaimer"]

def test_ocr_missing_or_ambiguous_fields():
    """Verify that an ambiguous receipt leaves missing fields blank and records ambiguities."""
    sparse_text = """
    RECEIPT OF DEPOSIT
    Some Commercial Bank
    Date: 2024-05-10
    Amount: Rs. 50,000.00
    Account: Random Customer
    """
    pdf_bytes = create_sample_pdf(sparse_text)
    res = client.post(
        "/api/documents/upload",
        files={"file": ("sparse_doc.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert res.status_code == 201
    data = res.json()
    fields = data["extractedFields"]
    # Reference should not be fabricated
    assert fields["reference"] is None
    # Ambiguities should be noted
    assert len(data["ambiguities"]) > 0
    assert data["isComplete"] is False

def test_duplicate_fdr_reference_handling():
    """Verify that attempting to vault a new FDR with an existing reference triggers 409 Conflict."""
    # FDR-AICTE-2024-9102 already exists in the database
    duplicate_payload = {
        "reference": "FDR-AICTE-2024-9102",
        "institutionCode": "SPIT-MH-019",
        "bankName": "State Bank of India",
        "branch": "Andheri West, Mumbai",
        "ifsc": "SBIN0001823",
        "depositAmount": 3500000,
        "currency": "INR",
        "interestRate": "7.10%",
        "issueDate": "2024-01-15",
        "maturityDate": "2029-01-15",
        "verificationStatus": "Pending",
        "priority": "Standard"
    }
    res = client.post("/api/fdrs", json=duplicate_payload)
    assert res.status_code == 409
    assert "already registered" in res.json()["detail"].lower()

def test_link_document_to_fdr_and_preview():
    """Verify that an uploaded document can be linked to an existing FDR and previewed."""
    # 1. Upload valid document
    pdf_bytes = create_sample_pdf(
        "STATE BANK OF INDIA\nFDR No: FDR-LINK-TEST-99\n"
        "Deposit Amount: Rs. 35,00,000.00\nIssue: 15/01/2024\nMaturity: 15/01/2029"
    )
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lien_scan.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["documentId"]

    # 2. Link to existing FDR FDR-2024-9102
    link_res = client.post(
        f"/api/documents/{doc_id}/link",
        json={
            "fdrId": "FDR-2024-9102",
            "notes": "Audited against physical receipt copy"
        }
    )
    assert link_res.status_code == 200
    assert link_res.json()["status"] == "success"

    # 3. Preview document
    preview_res = client.get(f"/api/documents/{doc_id}/preview")
    assert preview_res.status_code == 200
    assert preview_res.headers["content-type"] == "application/pdf"
    assert preview_res.headers["x-content-type-options"] == "nosniff"
