from datetime import date
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.fdr import FDR
from app.schemas.dashboard import DashboardSummaryOut, StatusDistributionItem, UpcomingMaturityItem

STATUS_COLORS = {
    "Verified": "#1b7943",
    "Pending": "#d97706",
    "Discrepancy": "#dc2626",
    "Expiring Soon": "#ff6b35"
}

def get_dashboard_summary(db: Session) -> DashboardSummaryOut:
    # 1. Total FDRs & Total Deposit
    total_stats = db.execute(
        select(
            func.count(FDR.id).label("total_count"),
            func.coalesce(func.sum(FDR.deposit_amount), 0).label("total_deposit")
        )
    ).one()
    total_fdrs = int(total_stats.total_count or 0)
    total_deposit_amount = float(total_stats.total_deposit or 0.0)

    # 2. Expiring soon count
    expiring_soon_count = db.execute(
        select(func.count(FDR.id)).where(FDR.verification_status == "Expiring Soon")
    ).scalar_one()

    # 3. Pending verification count
    pending_count = db.execute(
        select(func.count(FDR.id)).where(FDR.verification_status == "Pending")
    ).scalar_one()

    # 4. Overdue / Discrepancy cases
    overdue_count = db.execute(
        select(func.count(FDR.id)).where(
            (FDR.verification_status == "Discrepancy") | (FDR.priority == "Critical")
        )
    ).scalar_one()

    return DashboardSummaryOut(
        total_fdrs=total_fdrs,
        total_deposit_amount=total_deposit_amount,
        expiring_soon_count=expiring_soon_count,
        pending_verification_count=pending_count,
        overdue_count=overdue_count
    )

def get_status_distribution(db: Session) -> list[StatusDistributionItem]:
    counts_by_status = dict(
        db.execute(
            select(FDR.verification_status, func.count(FDR.id))
            .group_by(FDR.verification_status)
        ).all()
    )

    total_count = sum(counts_by_status.values()) or 1

    result = []
    # Guarantee standard AICTE status ordering
    standard_statuses = ["Verified", "Pending", "Discrepancy", "Expiring Soon"]
    for s_name in standard_statuses:
        val = counts_by_status.get(s_name, 0)
        pct = round((val / total_count) * 100, 1)
        result.append(
            StatusDistributionItem(
                name=s_name,
                value=val,
                color=STATUS_COLORS.get(s_name, "#718096"),
                percentage=pct
            )
        )

    # Any extra non-standard statuses if present
    for s_name, val in counts_by_status.items():
        if s_name not in standard_statuses:
            pct = round((val / total_count) * 100, 1)
            result.append(
                StatusDistributionItem(
                    name=s_name,
                    value=val,
                    color="#4a5568",
                    percentage=pct
                )
            )

    return result

def get_upcoming_maturities(db: Session) -> list[UpcomingMaturityItem]:
    # Fetch maturity dates and amounts
    records = db.execute(
        select(FDR.maturity_date, FDR.deposit_amount).order_by(FDR.maturity_date.asc())
    ).all()

    month_buckets = defaultdict(lambda: {"count": 0, "amount": 0.0, "timestamp": 0})

    for mat_date, amount in records:
        if not mat_date:
            continue
        month_key = mat_date.strftime("%b %Y")
        bucket = month_buckets[month_key]
        bucket["count"] += 1
        bucket["amount"] += float(amount)
        bucket["timestamp"] = date(mat_date.year, mat_date.month, 1).toordinal()

    # Sort chronologically and take next 6 upcoming buckets
    sorted_months = sorted(month_buckets.items(), key=lambda item: item[1]["timestamp"])[:6]

    items = []
    for month_name, data in sorted_months:
        lakhs = int(round(data["amount"] / 100000))
        label_text = f"{lakhs}L ({data['count']} FDR{'s' if data['count'] > 1 else ''})"
        if lakhs >= 100:
            cr = round(lakhs / 100, 1)
            label_text = f"{cr}Cr ({data['count']} FDR{'s' if data['count'] > 1 else ''})"

        items.append(
            UpcomingMaturityItem(
                month=month_name,
                count=data["count"],
                amount_in_lakhs=lakhs,
                label=label_text
            )
        )

    return items
