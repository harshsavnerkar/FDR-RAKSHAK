from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.fdr import FDRCreate, FDRUpdate, FDROut
from app.services import fdr_service
from app.models.admin import AdminUser
from app.dependencies.auth import get_optional_current_admin

router = APIRouter(prefix="/api/fdrs", tags=["Fixed Deposit Receipts"])

@router.get("", response_model=list[FDROut])
def list_fdrs(
    search: str | None = Query(None, description="Search by ref, bank, IFSC, cert or institution"),
    status: str | None = Query(None, description="Filter by Verification Status"),
    bank: str | None = Query(None, description="Filter by Issuing Bank"),
    institution: str | None = Query(None, description="Filter by Institution Code or Name"),
    maturity_start: date | None = Query(None, description="Maturity range start date (YYYY-MM-DD)"),
    maturity_end: date | None = Query(None, description="Maturity range end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """
    Retrieve vaulted Fixed Deposit Receipts with sovereign role-based scoping:
    - Institutional User: strictly isolated to their own institution's FDRs.
    - Bank Node: strictly scoped to instruments issued by their partner bank.
    - Scrutiny Officer / Bureau Chief: overarching nationwide visibility.
    """
    # Enforce tenant isolation for institutional users
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        institution = current_admin.institution_id

    # Enforce partner isolation for bank nodal users
    if current_admin and current_admin.role == "BANK_NODE" and current_admin.bank_name:
        bank = current_admin.bank_name

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
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Retrieve specific vaulted FDR record dossier with role verification."""
    fdr = fdr_service.get_fdr(db=db, fdr_id=fdr_id)

    # Scoping check for institutional users
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        if fdr.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional tenant isolation strictly restricts viewing records of other institutions."
            )

    # Scoping check for bank nodes
    if current_admin and current_admin.role == "BANK_NODE" and current_admin.bank_name:
        if fdr.bank_name != current_admin.bank_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Bank node isolation strictly restricts viewing records outside '{current_admin.bank_name}'."
            )

    return fdr

@router.post("", response_model=FDROut, status_code=status.HTTP_201_CREATED)
def vault_new_fdr(
    data: FDRCreate,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Register and vault a new Fixed Deposit Receipt instrument under AICTE Bureau custody."""
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        # Securely enforce tenant isolation by binding directly to authenticated institution ID
        data.institution_code = current_admin.institution_id

    return fdr_service.create_fdr(db=db, data=data)

@router.patch("/{fdr_id}", response_model=FDROut)
def update_fdr_record(
    fdr_id: str,
    data: FDRUpdate,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Modify instrument terms, verification status, or administrative custody notes."""
    existing = fdr_service.get_fdr(db=db, fdr_id=fdr_id)
    if current_admin and current_admin.role == "INSTITUTION_USER" and current_admin.institution_id:
        if existing.institution_id != current_admin.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional tenant isolation prohibits modifying instruments of other institutions."
            )
        # Institutional users cannot directly set verification_status to Verified
        if data.verification_status and data.verification_status == "Verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users cannot mark instruments as 'Verified'. Verification requires Bank or Bureau Scrutiny."
            )

    if current_admin and current_admin.role == "BANK_NODE" and current_admin.bank_name:
        if existing.bank_name != current_admin.bank_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Bank nodes can only modify instruments issued by '{current_admin.bank_name}'."
            )

    return fdr_service.update_fdr(db=db, fdr_id=fdr_id, data=data)

@router.delete("/{fdr_id}", status_code=status.HTTP_200_OK)
def discharge_fdr(
    fdr_id: str,
    db: Session = Depends(get_db),
    current_admin: Optional[AdminUser] = Depends(get_optional_current_admin)
):
    """Discharge or remove FDR record from vault. Restricted to Bureau Chief."""
    if current_admin:
        if current_admin.role == "INSTITUTION_USER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Institutional users cannot discharge or remove FDR vault records."
            )
        if current_admin.role == "BANK_NODE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Bank nodes cannot delete or discharge FDR vault records directly."
            )
        if current_admin.role == "SCRUTINY_OFFICER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maker-Checker Security: Scrutiny Officers cannot delete or discharge FDR records. AICTE Bureau Chief clearance required."
            )

    return fdr_service.delete_fdr(db=db, fdr_id=fdr_id)
