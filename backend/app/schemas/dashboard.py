from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class DashboardSummaryOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_fdrs: int
    total_deposit_amount: float
    expiring_soon_count: int
    pending_verification_count: int
    overdue_count: int

class StatusDistributionItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    value: int
    color: str
    percentage: float

class UpcomingMaturityItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    month: str
    count: int
    amount_in_lakhs: int
    label: str
