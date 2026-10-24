import json
import logging
from datetime import datetime, date
from decimal import Decimal
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database import SessionLocal
from app.models.institution import Institution
from app.models.fdr import FDR

logger = logging.getLogger("fdr_smartguard.seed")

def parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None

def seed_database(db: Session) -> dict:
    json_path = Path(__file__).resolve().parent / "seed_records.json"
    if not json_path.exists():
        raise FileNotFoundError(f"Seed records file not found at {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_institutions = data.get("institutions", [])
    raw_fdrs = data.get("fdrs", [])

    logger.info(f"Loaded {len(raw_institutions)} institutions and {len(raw_fdrs)} FDRs from seed file.")

    # 1. Seed Institutions
    inst_code_to_id = {}
    institutions_added = 0
    institutions_updated = 0

    for item in raw_institutions:
        inst_id = item.get("id") or f"INST-{item['code']}"
        code = item["code"].strip().upper()
        inst_code_to_id[code] = inst_id

        existing = db.get(Institution, inst_id)
        if not existing:
            # Also check by unique code
            existing = db.execute(
                select(Institution).where(func.lower(Institution.code) == code.lower())
            ).scalar_one_or_none()

        if existing:
            # Update fields
            existing.name = item["name"]
            existing.code = code
            existing.pid = item.get("pid")
            existing.type = item.get("type", "Technical Degree (UG/PG)")
            existing.pincode = item.get("pincode", "400058")
            existing.state = item.get("state", "Maharashtra")
            existing.city = item.get("city", "")
            existing.address = item.get("address", "")
            existing.trust = item.get("trust")
            existing.contact_person = item.get("contactPerson", "")
            existing.email = item.get("email", "")
            existing.phone = item.get("phone", "")
            institutions_updated += 1
            inst_code_to_id[code] = existing.id
        else:
            new_inst = Institution(
                id=inst_id,
                name=item["name"],
                code=code,
                pid=item.get("pid"),
                type=item.get("type", "Technical Degree (UG/PG)"),
                pincode=item.get("pincode", "400058"),
                state=item.get("state", "Maharashtra"),
                city=item.get("city", ""),
                address=item.get("address", ""),
                trust=item.get("trust"),
                contact_person=item.get("contactPerson", ""),
                email=item.get("email", ""),
                phone=item.get("phone", "")
            )
            db.add(new_inst)
            institutions_added += 1

    db.commit()

    # 2. Seed FDRs with foreign key association
    fdrs_added = 0
    fdrs_updated = 0

    for item in raw_fdrs:
        fdr_id = item["id"]
        inst_code = item["institutionCode"].strip().upper()
        inst_id = inst_code_to_id.get(inst_code)

        if not inst_id:
            # Look up institution from database
            inst_record = db.execute(
                select(Institution).where(func.lower(Institution.code) == inst_code.lower())
            ).scalar_one_or_none()
            if inst_record:
                inst_id = inst_record.id
                inst_code_to_id[inst_code] = inst_id
            else:
                logger.warning(f"Skipping FDR {item['reference']}: Institution code {inst_code} not found.")
                continue

        existing = db.get(FDR, fdr_id)
        if not existing:
            existing = db.execute(
                select(FDR).where(func.lower(FDR.reference) == item["reference"].strip().lower())
            ).scalar_one_or_none()

        dep_amount = Decimal(str(item.get("depositAmount", 0)))
        iss_date = parse_date(item.get("issueDate")) or date.today()
        mat_date = parse_date(item.get("maturityDate")) or date.today()
        audit_date = parse_date(item.get("lastAudited"))

        if existing:
            existing.reference = item["reference"]
            existing.institution_id = inst_id
            existing.bank_name = item.get("bankName", "State Bank of India")
            existing.branch = item.get("branch", "Main Branch")
            existing.ifsc = item.get("ifsc", "SBIN0001000")
            existing.certificate_no = item.get("certificateNo")
            existing.deposit_amount = dep_amount
            existing.currency = item.get("currency", "INR")
            existing.interest_rate = item.get("interestRate", "7.10%")
            existing.issue_date = iss_date
            existing.maturity_date = mat_date
            existing.verification_status = item.get("verificationStatus", "Pending")
            existing.priority = item.get("priority", "Standard")
            existing.joint_lien_holder = item.get("jointLienHolder")
            existing.lien_status = item.get("lienStatus")
            existing.ocr_confidence = Decimal(str(item.get("ocrConfidence", 95.0)))
            existing.physical_location = item.get("physicalLocation")
            existing.discrepancy_note = item.get("discrepancyNote")
            existing.last_audited = audit_date
            existing.category = item.get("category")
            fdrs_updated += 1
        else:
            new_fdr = FDR(
                id=fdr_id,
                reference=item["reference"],
                institution_id=inst_id,
                bank_name=item.get("bankName", "State Bank of India"),
                branch=item.get("branch", "Main Branch"),
                ifsc=item.get("ifsc", "SBIN0001000"),
                certificate_no=item.get("certificateNo"),
                deposit_amount=dep_amount,
                currency=item.get("currency", "INR"),
                interest_rate=item.get("interestRate", "7.10%"),
                issue_date=iss_date,
                maturity_date=mat_date,
                verification_status=item.get("verificationStatus", "Pending"),
                priority=item.get("priority", "Standard"),
                joint_lien_holder=item.get("jointLienHolder"),
                lien_status=item.get("lienStatus"),
                ocr_confidence=Decimal(str(item.get("ocrConfidence", 95.0))),
                physical_location=item.get("physicalLocation"),
                discrepancy_note=item.get("discrepancyNote"),
                last_audited=audit_date,
                category=item.get("category")
            )
            db.add(new_fdr)
            fdrs_added += 1

    db.commit()

    # Verification counts and amounts
    total_institutions = db.execute(select(func.count(Institution.id))).scalar_one()
    total_fdrs = db.execute(select(func.count(FDR.id))).scalar_one()
    total_amount = db.execute(select(func.coalesce(func.sum(FDR.deposit_amount), 0))).scalar_one()

    summary = {
        "status": "success",
        "institutions_added": institutions_added,
        "institutions_updated": institutions_updated,
        "total_institutions": total_institutions,
        "fdrs_added": fdrs_added,
        "fdrs_updated": fdrs_updated,
        "total_fdrs": total_fdrs,
        "total_deposit_amount": float(total_amount),
        "expected_deposit_amount": 48500000.0,
        "deposit_match": float(total_amount) == 48500000.0
    }

    logger.info(f"Database seed completed: {summary}")
    return summary

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        res = seed_database(db)
        print("SEED_RESULT:", json.dumps(res, indent=2))
    finally:
        db.close()
