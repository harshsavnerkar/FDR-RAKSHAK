from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

STATUTORY_DISCLAIMER = (
    "STATUTORY NOTICE: Automated OCR extraction and optical parsing do not constitute "
    "legal proof of bank lien authenticity or tripartite encumbrance. All extracted values "
    "must be reviewed by an authorized AICTE bureau officer against the official bank lien certificate."
)

class DocumentFields(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reference: str | None = None
    bank_name: str | None = None
    branch: str | None = None
    ifsc: str | None = None
    certificate_no: str | None = None
    account_holder: str | None = None
    deposit_amount: float | None = None
    currency: str = "INR"
    interest_rate: str | None = None
    issue_date: str | None = None
    maturity_date: str | None = None
    maturity_amount: float | None = None
    lien_status: str | None = None

class DocumentUploadResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    document_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    engine_used: str
    raw_text: str
    extracted_fields: DocumentFields
    field_confidence: dict[str, float] = Field(default_factory=dict)
    overall_confidence: float = 0.0
    ambiguities: list[str] = Field(default_factory=list)
    is_complete: bool = False
    disclaimer: str = STATUTORY_DISCLAIMER
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DocumentLinkRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fdr_id: str
    update_vault_record: bool = False
    notes: str | None = None
    corrected_fields: dict | None = None

class OCRStatusResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    pdf_engine_available: bool
    pdf_engine: str | None = None
    tesseract_available: bool
    tesseract_path: str | None = None
    max_upload_size_bytes: int
    allowed_extensions: list[str]
    allowed_mime_types: list[str]
