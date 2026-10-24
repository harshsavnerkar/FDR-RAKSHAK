from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.fdr import FDRCreate, FDRUpdate, FDROut
from app.services import fdr_service

router = APIRouter(prefix="/api/fdrs", tags=["Fixed Deposit Receipts"])

@router.get("", response_model=list[FDROut])
def list_fdrs(
    search: str | None = Query(None, description="Search by ref, bank, IFSC, cert or institution"),
    status: str | None = Query(None, description="Filter by Verification Status"),
    bank: str | None = Query(None, description="Filter by Issuing Bank"),
    institution: str | None = Query(None, description="Filter by Institution Code or Name"),
    maturity_start: date | None = Query(None, description="Maturity range start date (YYYY-MM-DD)"),
    maturity_end: date | None = Query(None, description="Maturity range end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Retrieve all vaulted Fixed Deposit Receipts with associated institution details."""
    return fdr_service.get_fdrs(
        db=db,
        search=search,
        verification_status=status,
        bank_name=bank,
        institution_code=institution,
        maturity_start=maturity_start,
        maturity_end=maturity_end
    )

@router.get("/{fdr_id}", response_model=FDROut)
def get_fdr_by_id(
    fdr_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve specific vaulted FDR record dossier."""
    return fdr_service.get_fdr(db=db, fdr_id=fdr_id)

@router.post("", response_model=FDROut, status_code=status.HTTP_201_CREATED)
def vault_new_fdr(
    data: FDRCreate,
    db: Session = Depends(get_db)
):
    """Register and vault a new Fixed Deposit Receipt instrument under AICTE Bureau custody."""
    return fdr_service.create_fdr(db=db, data=data)

@router.patch("/{fdr_id}", response_model=FDROut)
def update_fdr_record(
    fdr_id: str,
    data: FDRUpdate,
    db: Session = Depends(get_db)
):
    """Modify instrument terms, verification status, or administrative custody notes."""
    return fdr_service.update_fdr(db=db, fdr_id=fdr_id, data=data)

@router.delete("/{fdr_id}", status_code=status.HTTP_200_OK)
def discharge_fdr(
    fdr_id: str,
    db: Session = Depends(get_db)
):
    """Discharge or remove FDR record from vault."""
    return fdr_service.delete_fdr(db=db, fdr_id=fdr_id)
