from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dashboard import DashboardSummaryOut, StatusDistributionItem, UpcomingMaturityItem
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Retrieve overarching AICTE security deposit statistics and priority alerts."""
    return dashboard_service.get_dashboard_summary(db=db)

@router.get("/status-distribution", response_model=list[StatusDistributionItem])
def get_status_distribution(db: Session = Depends(get_db)):
    """Retrieve FDR verification status breakdown percentages for charts."""
    return dashboard_service.get_status_distribution(db=db)

@router.get("/upcoming-maturities", response_model=list[UpcomingMaturityItem])
def get_upcoming_maturities(db: Session = Depends(get_db)):
    """Retrieve 6-month upcoming maturity timeline grouped by month."""
    return dashboard_service.get_upcoming_maturities(db=db)
