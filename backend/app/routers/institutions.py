from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.institution import InstitutionCreate, InstitutionUpdate, InstitutionOut
from app.services import institution_service
from app.models.admin import AdminUser
from app.dependencies.auth import get_optional_current_admin

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

@router.get("", response_model=list[InstitutionOut])
def list_institutions(
    search: str | None = Query(None, description="Search query by name, PID, code, city or PIN code"),
    state: str | None = Query(None, description="Filter by Indian State/UT"),
    type: str | None = Query(None, description="Filter by Institution Discipline/Type"),
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Retrieve list of technical institutions with linked FDR counts and deposit lien totals.
    - Institutional User: strictly isolated to their own institution.
    """
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        single_inst = institution_service.get_institution(db=db, institution_id=current_admin.institution_id)
        return [single_inst] if single_inst else []

    return institution_service.get_institutions(db=db, search=search, state=state, inst_type=type)

@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution_by_id(
    institution_id: str,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Retrieve specific institution dossier with active vaulted deposit totals."""
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        if institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional tenant isolation strictly restricts viewing details of other institutions."
            )

    return institution_service.get_institution(db=db, institution_id=institution_id)

@router.post("", response_model=InstitutionOut, status_code=status.HTTP_201_CREATED)
def register_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Register a new technical institution in the AICTE Bureau repository."""
    if current_admin and current_admin.role in ("INSTITUTION_USER", "BANK_NODE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Institutional and Bank accounts cannot register new institutions."
        )

    return institution_service.create_institution(db=db, data=data)

@router.patch("/{institution_id}", response_model=InstitutionOut)
def update_institution(
    institution_id: str,
    data: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Update institutional contact, address, or administrative profile."""
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        if institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You can only update your own institution profile."
            )
    elif current_admin and current_admin.role == "BANK_NODE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Bank accounts cannot modify institutional profiles."
        )

    return institution_service.update_institution(db=db, institution_id=institution_id, data=data)

@router.delete("/{institution_id}", status_code=status.HTTP_200_OK)
def delete_institution(
    institution_id: str,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Delete institution with administrative guard: blocked if active FDRs are pledged."""
    if current_admin and current_admin.role in ("INSTITUTION_USER", "BANK_NODE", "SCRUTINY_OFFICER"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only AICTE Bureau Chief has authorization to remove institution entities."
        )

    return institution_service.delete_institution(db=db, institution_id=institution_id)
