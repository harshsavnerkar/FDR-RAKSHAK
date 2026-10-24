from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.institution import InstitutionCreate, InstitutionUpdate, InstitutionOut
from app.services import institution_service

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

@router.get("", response_model=list[InstitutionOut])
def list_institutions(
    search: str | None = Query(None, description="Search query by name, PID, code, city or PIN code"),
    state: str | None = Query(None, description="Filter by Indian State/UT"),
    type: str | None = Query(None, description="Filter by Institution Discipline/Type"),
    db: Session = Depends(get_db)
):
    """Retrieve list of technical institutions with linked FDR counts and deposit lien totals."""
    return institution_service.get_institutions(db=db, search=search, state=state, inst_type=type)

@router.get("/{institution_id}", response_model=InstitutionOut)
def get_institution_by_id(
    institution_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve specific institution dossier with active vaulted deposit totals."""
    return institution_service.get_institution(db=db, institution_id=institution_id)

@router.post("", response_model=InstitutionOut, status_code=status.HTTP_201_CREATED)
def register_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db)
):
    """Register a new technical institution in the AICTE Bureau repository."""
    return institution_service.create_institution(db=db, data=data)

@router.patch("/{institution_id}", response_model=InstitutionOut)
def update_institution(
    institution_id: str,
    data: InstitutionUpdate,
    db: Session = Depends(get_db)
):
    """Update institutional contact, address, or administrative profile."""
    return institution_service.update_institution(db=db, institution_id=institution_id, data=data)

@router.delete("/{institution_id}", status_code=status.HTTP_200_OK)
def delete_institution(
    institution_id: str,
    db: Session = Depends(get_db)
):
    """Delete institution with administrative guard: blocked if active FDRs are pledged."""
    return institution_service.delete_institution(db=db, institution_id=institution_id)
