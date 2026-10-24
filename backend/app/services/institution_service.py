import time
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from fastapi import HTTPException, status
from app.models.institution import Institution
from app.models.fdr import FDR
from app.schemas.institution import InstitutionCreate, InstitutionUpdate, InstitutionOut

def _serialize_institution(inst: Institution, fdr_count: int = 0, total_deposit: float = 0.0) -> InstitutionOut:
    return InstitutionOut(
        id=inst.id,
        name=inst.name,
        code=inst.code,
        pid=inst.pid,
        type=inst.type,
        pincode=inst.pincode,
        state=inst.state,
        city=inst.city,
        address=inst.address,
        trust=inst.trust,
        contact_person=inst.contact_person,
        email=inst.email,
        phone=inst.phone,
        fdr_count=fdr_count,
        total_deposit=total_deposit,
        created_at=inst.created_at,
        updated_at=inst.updated_at
    )

def get_institutions(
    db: Session,
    search: str | None = None,
    state: str | None = None,
    inst_type: str | None = None
) -> list[InstitutionOut]:
    # Query institutions along with aggregated FDR count and sum
    fdr_subq = (
        select(
            FDR.institution_id,
            func.count(FDR.id).label("fdr_count"),
            func.coalesce(func.sum(FDR.deposit_amount), 0).label("total_deposit")
        )
        .group_by(FDR.institution_id)
        .subquery()
    )

    query = (
        select(
            Institution,
            func.coalesce(fdr_subq.c.fdr_count, 0).label("fdr_count"),
            func.coalesce(fdr_subq.c.total_deposit, 0).label("total_deposit")
        )
        .outerjoin(fdr_subq, Institution.id == fdr_subq.c.institution_id)
    )

    if state and state != "All":
        query = query.where(Institution.state == state)

    if inst_type and inst_type != "All":
        query = query.where(Institution.type == inst_type)

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Institution.name).like(q),
                func.lower(Institution.code).like(q),
                func.lower(Institution.pid).like(q),
                func.lower(Institution.city).like(q),
                Institution.pincode.like(q)
            )
        )

    query = query.order_by(Institution.name.asc())
    results = db.execute(query).all()

    return [
        _serialize_institution(inst, int(f_count), float(t_dep))
        for inst, f_count, t_dep in results
    ]

def get_institution(db: Session, institution_id: str) -> InstitutionOut:
    fdr_stats = (
        select(
            func.count(FDR.id).label("fdr_count"),
            func.coalesce(func.sum(FDR.deposit_amount), 0).label("total_deposit")
        )
        .where(FDR.institution_id == institution_id)
    )
    f_count, t_dep = db.execute(fdr_stats).one()

    inst = db.get(Institution, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' not found."
        )

    return _serialize_institution(inst, int(f_count or 0), float(t_dep or 0))

def create_institution(db: Session, data: InstitutionCreate) -> InstitutionOut:
    # Check duplicate code
    existing_code = db.execute(
        select(Institution).where(func.lower(Institution.code) == data.code.lower())
    ).scalar_one_or_none()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Institution with code '{data.code}' already exists."
        )

    # Check duplicate PID if supplied
    if data.pid and data.pid.strip():
        existing_pid = db.execute(
            select(Institution).where(func.lower(Institution.pid) == data.pid.strip().lower())
        ).scalar_one_or_none()
        if existing_pid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Institution with PID '{data.pid}' already registered."
            )

    inst_id = f"INST-{data.code.strip().upper()}"
    new_inst = Institution(
        id=inst_id,
        name=data.name.strip(),
        code=data.code.strip().upper(),
        pid=data.pid.strip() if data.pid else f"PID-{str(int(time.time()))[-6:]}",
        type=data.type,
        pincode=data.pincode,
        state=data.state,
        city=data.city.strip(),
        address=data.address.strip(),
        trust=data.trust.strip() if data.trust else None,
        contact_person=data.contact_person.strip(),
        email=str(data.email).strip().lower(),
        phone=data.phone.strip()
    )

    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)

    return _serialize_institution(new_inst, 0, 0.0)

def update_institution(db: Session, institution_id: str, data: InstitutionUpdate) -> InstitutionOut:
    inst = db.get(Institution, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' not found."
        )

    # Check unique code if updated
    if data.code and data.code.strip().upper() != inst.code:
        dup_code = db.execute(
            select(Institution).where(
                func.lower(Institution.code) == data.code.strip().lower(),
                Institution.id != institution_id
            )
        ).scalar_one_or_none()
        if dup_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Institution code '{data.code}' is already assigned to another institution."
            )
        inst.code = data.code.strip().upper()

    # Check unique PID if updated
    if data.pid is not None and data.pid.strip() != (inst.pid or ""):
        if data.pid.strip():
            dup_pid = db.execute(
                select(Institution).where(
                    func.lower(Institution.pid) == data.pid.strip().lower(),
                    Institution.id != institution_id
                )
            ).scalar_one_or_none()
            if dup_pid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"PID '{data.pid}' is already registered to another institution."
                )
        inst.pid = data.pid.strip() or None

    if data.name is not None:
        inst.name = data.name.strip()
    if data.type is not None:
        inst.type = data.type
    if data.pincode is not None:
        inst.pincode = data.pincode
    if data.state is not None:
        inst.state = data.state
    if data.city is not None:
        inst.city = data.city.strip()
    if data.address is not None:
        inst.address = data.address.strip()
    if data.trust is not None:
        inst.trust = data.trust.strip() if data.trust else None
    if data.contact_person is not None:
        inst.contact_person = data.contact_person.strip()
    if data.email is not None:
        inst.email = str(data.email).strip().lower()
    if data.phone is not None:
        inst.phone = data.phone.strip()

    db.commit()
    db.refresh(inst)

    # Re-fetch stats
    return get_institution(db, institution_id)

def delete_institution(db: Session, institution_id: str) -> dict:
    inst = db.get(Institution, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with ID '{institution_id}' not found."
        )

    # Protection against deleting institution with active linked FDRs
    linked_fdrs_count = db.execute(
        select(func.count(FDR.id)).where(FDR.institution_id == institution_id)
    ).scalar_one()

    if linked_fdrs_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Administrative Block: Cannot delete institution '{inst.name}' because it holds {linked_fdrs_count} active FDR deposit lien(s). Discharge or reassign FDRs first."
        )

    db.delete(inst)
    db.commit()
    return {"message": f"Institution '{inst.name}' successfully deleted.", "id": institution_id}
