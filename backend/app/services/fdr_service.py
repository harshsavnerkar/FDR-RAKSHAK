import time
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, func
from fastapi import HTTPException, status
from app.models.fdr import FDR
from app.models.institution import Institution
from app.schemas.fdr import FDRCreate, FDRUpdate, FDROut

def _serialize_fdr(fdr: FDR) -> FDROut:
    inst = fdr.institution
    return FDROut(
        id=fdr.id,
        reference=fdr.reference,
        institution_id=fdr.institution_id,
        institution=inst.name if inst else "Unknown Institution",
        institution_code=inst.code if inst else "",
        trust=inst.trust if inst else "",
        state=inst.state if inst else "",
        region=f"{inst.state} Region" if inst else "AICTE HQ",
        bank_name=fdr.bank_name,
        branch=fdr.branch,
        ifsc=fdr.ifsc,
        certificate_no=fdr.certificate_no,
        deposit_amount=float(fdr.deposit_amount),
        currency=fdr.currency,
        interest_rate=fdr.interest_rate,
        issue_date=fdr.issue_date,
        maturity_date=fdr.maturity_date,
        verification_status=fdr.verification_status,
        priority=fdr.priority,
        joint_lien_holder=fdr.joint_lien_holder,
        lien_status=fdr.lien_status,
        ocr_confidence=float(fdr.ocr_confidence) if fdr.ocr_confidence is not None else 95.0,
        physical_location=fdr.physical_location,
        discrepancy_note=fdr.discrepancy_note,
        last_audited=fdr.last_audited,
        category=fdr.category or (inst.type if inst else "Engineering & Technology"),
        created_at=fdr.created_at,
        updated_at=fdr.updated_at
    )

def get_fdrs(
    db: Session,
    search: str | None = None,
    verification_status: str | None = None,
    bank_name: str | None = None,
    institution_code: str | None = None,
    maturity_start: date | None = None,
    maturity_end: date | None = None,
) -> list[FDROut]:
    query = select(FDR).options(joinedload(FDR.institution))

    if verification_status and verification_status != "All":
        query = query.where(FDR.verification_status == verification_status)

    if bank_name and bank_name != "All":
        query = query.where(FDR.bank_name == bank_name)

    if institution_code and institution_code != "All":
        query = query.join(FDR.institution).where(
            or_(
                Institution.code == institution_code,
                Institution.id == institution_code,
                Institution.name == institution_code
            )
        )

    if maturity_start:
        query = query.where(FDR.maturity_date >= maturity_start)

    if maturity_end:
        query = query.where(FDR.maturity_date <= maturity_end)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        # Join institution if not already joined
        if not institution_code or institution_code == "All":
            query = query.join(FDR.institution)
        query = query.where(
            or_(
                func.lower(FDR.reference).like(q),
                func.lower(FDR.bank_name).like(q),
                func.lower(FDR.branch).like(q),
                func.lower(FDR.ifsc).like(q),
                func.lower(FDR.certificate_no).like(q),
                func.lower(Institution.name).like(q),
                func.lower(Institution.code).like(q)
            )
        )

    query = query.order_by(FDR.maturity_date.asc())
    results = db.execute(query).scalars().all()

    return [_serialize_fdr(item) for item in results]

def get_fdr(db: Session, fdr_id: str) -> FDROut:
    query = select(FDR).options(joinedload(FDR.institution)).where(FDR.id == fdr_id)
    fdr = db.execute(query).scalar_one_or_none()

    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR record with ID '{fdr_id}' not found."
        )

    return _serialize_fdr(fdr)

def create_fdr(db: Session, data: FDRCreate) -> FDROut:
    # 1. Resolve institution
    inst = db.execute(
        select(Institution).where(
            or_(
                Institution.code == data.institution_code.strip().upper(),
                Institution.id == data.institution_code.strip()
            )
        )
    ).scalar_one_or_none()

    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Associated institution with code/ID '{data.institution_code}' does not exist."
        )

    # 2. Check duplicate FDR reference
    dup = db.execute(
        select(FDR).where(func.lower(FDR.reference) == data.reference.strip().lower())
    ).scalar_one_or_none()

    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"FDR reference '{data.reference}' already registered in the repository."
        )

    fdr_id = f"FDR-{int(time.time() * 1000)}"
    new_fdr = FDR(
        id=fdr_id,
        reference=data.reference.strip().upper(),
        institution_id=inst.id,
        bank_name=data.bank_name.strip(),
        branch=data.branch.strip(),
        ifsc=data.ifsc.strip().upper(),
        certificate_no=data.certificate_no.strip() if data.certificate_no else None,
        deposit_amount=data.deposit_amount,
        currency=data.currency or "INR",
        interest_rate=data.interest_rate or "7.10%",
        issue_date=data.issue_date,
        maturity_date=data.maturity_date,
        verification_status=data.verification_status or "Pending",
        priority=data.priority or "Standard",
        joint_lien_holder=data.joint_lien_holder or f"Member Secretary AICTE & Principal {inst.code}",
        lien_status=data.lien_status or "Lien Marked to AICTE New Delhi",
        ocr_confidence=data.ocr_confidence if data.ocr_confidence is not None else 95.0,
        physical_location=data.physical_location or "Intake Vault / Staging Tray 01",
        discrepancy_note=data.discrepancy_note,
        last_audited=data.last_audited or date.today(),
        category=data.category or inst.type
    )

    db.add(new_fdr)
    db.commit()
    db.refresh(new_fdr)

    return get_fdr(db, new_fdr.id)

def update_fdr(db: Session, fdr_id: str, data: FDRUpdate) -> FDROut:
    fdr = db.get(FDR, fdr_id)
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR record with ID '{fdr_id}' not found."
        )

    # Check reference uniqueness if updated
    if data.reference and data.reference.strip().upper() != fdr.reference:
        dup_ref = db.execute(
            select(FDR).where(
                func.lower(FDR.reference) == data.reference.strip().lower(),
                FDR.id != fdr_id
            )
        ).scalar_one_or_none()
        if dup_ref:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Reference number '{data.reference}' is already vaulted by another FDR record."
            )
        fdr.reference = data.reference.strip().upper()

    # Re-link institution if requested
    if data.institution_code:
        inst = db.execute(
            select(Institution).where(
                or_(
                    Institution.code == data.institution_code.strip().upper(),
                    Institution.id == data.institution_code.strip()
                )
            )
        ).scalar_one_or_none()
        if not inst:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target institution '{data.institution_code}' does not exist."
            )
        fdr.institution_id = inst.id

    if data.bank_name is not None:
        fdr.bank_name = data.bank_name.strip()
    if data.branch is not None:
        fdr.branch = data.branch.strip()
    if data.ifsc is not None:
        fdr.ifsc = data.ifsc.strip().upper()
    if data.certificate_no is not None:
        fdr.certificate_no = data.certificate_no.strip() if data.certificate_no else None
    if data.deposit_amount is not None:
        fdr.deposit_amount = data.deposit_amount
    if data.currency is not None:
        fdr.currency = data.currency
    if data.interest_rate is not None:
        fdr.interest_rate = data.interest_rate
    if data.issue_date is not None:
        fdr.issue_date = data.issue_date
    if data.maturity_date is not None:
        fdr.maturity_date = data.maturity_date
    if data.verification_status is not None:
        fdr.verification_status = data.verification_status
    if data.priority is not None:
        fdr.priority = data.priority
    if data.joint_lien_holder is not None:
        fdr.joint_lien_holder = data.joint_lien_holder
    if data.lien_status is not None:
        fdr.lien_status = data.lien_status
    if data.ocr_confidence is not None:
        fdr.ocr_confidence = data.ocr_confidence
    if data.physical_location is not None:
        fdr.physical_location = data.physical_location
    if data.discrepancy_note is not None:
        fdr.discrepancy_note = data.discrepancy_note
    if data.last_audited is not None:
        fdr.last_audited = data.last_audited
    if data.category is not None:
        fdr.category = data.category

    # Enforce date order constraint if either changed
    if fdr.maturity_date < fdr.issue_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maturity date must be on or after issue date."
        )

    db.commit()
    db.refresh(fdr)

    return get_fdr(db, fdr.id)

def delete_fdr(db: Session, fdr_id: str) -> dict:
    fdr = db.get(FDR, fdr_id)
    if not fdr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FDR record with ID '{fdr_id}' not found."
        )

    db.delete(fdr)
    db.commit()
    return {"message": f"FDR '{fdr.reference}' removed from vault.", "id": fdr_id}
