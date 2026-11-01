from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = "user"
    exp: Optional[int] = None

# --- User Profile ---
class UserProfileOut(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    aadhaar_masked: Optional[str] = None
    pan_number: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    annual_income: Optional[str] = None
    education_degree: Optional[str] = None
    institution_name: Optional[str] = None
    passing_year: Optional[str] = None
    percentage_marks: Optional[str] = None
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    aadhaar_masked: Optional[str] = None
    pan_number: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    annual_income: Optional[str] = None
    education_degree: Optional[str] = None
    institution_name: Optional[str] = None
    passing_year: Optional[str] = None
    percentage_marks: Optional[str] = None
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

# --- Document Vault ---
class DocumentOut(BaseModel):
    id: str
    user_id: str
    document_type: str
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    extracted_data_preview: Dict[str, Any]
    expiry_date: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExtractedFieldItem(BaseModel):
    id: str
    field_name: str
    field_value: str
    confidence: float
    is_approved: bool
    is_sensitive: bool

class DocumentExtractResponse(BaseModel):
    document_id: str
    status: str
    extracted_fields: List[ExtractedFieldItem]

class ExtractedFieldApproval(BaseModel):
    field_id: str
    approved_value: str
    is_approved: bool

class DocumentApprovalRequest(BaseModel):
    approvals: List[ExtractedFieldApproval]

# --- Form Scanning & Understanding ---
class DetectedFieldOut(BaseModel):
    id: str
    form_id: str
    page_number: int
    field_id_str: str
    label: str
    normalized_name: str
    field_type: str
    is_required: bool
    expected_format: Optional[str] = None
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float
    explanation: Optional[str] = None
    explanation_te: Optional[str] = None
    explanation_hi: Optional[str] = None
    supporting_doc: Optional[str] = None
    confidence: float
    is_uncertain: bool
    filled_value: Optional[str] = None
    source_doc: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class FormPageOut(BaseModel):
    id: str
    page_number: int
    width: float
    height: float
    image_url: Optional[str] = None
    has_text: bool

    class Config:
        from_attributes = True

class FormOut(BaseModel):
    id: str
    user_id: str
    title: str
    original_filename: str
    file_type: str
    total_pages: int
    status: str
    organization_name: Optional[str] = None
    detected_metadata: Dict[str, Any]
    created_at: datetime
    pages: List[FormPageOut] = []
    fields: List[DetectedFieldOut] = []

    class Config:
        from_attributes = True

class DetectedFieldUpdate(BaseModel):
    filled_value: Optional[str] = None
    status: Optional[str] = None # 'confirmed', 'custom', 'rejected'

# --- AI Field Explanation & Chat ---
class FieldExplainRequest(BaseModel):
    field_id: str
    language: str = "en" # 'en', 'te', 'hi'

class FieldExplainResponse(BaseModel):
    field_id: str
    label: str
    meaning: str
    format_example: str
    supporting_doc: Optional[str] = None
    warnings: Optional[str] = None
    language: str

class FormChatRequest(BaseModel):
    field_id: Optional[str] = None
    message: str
    language: str = "en"

class FormChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[str] = None
    language: str

# --- Autofill ---
class AutofillRequest(BaseModel):
    mode: str = "assisted" # 'assisted' or 'automatic'

class AutofillSuggestionOut(BaseModel):
    field_id: str
    suggested_value: str
    confidence: float
    source: str
    is_auto_filled: bool
    needs_confirmation: bool
    reason: str

class AutofillResponse(BaseModel):
    form_id: str
    mode: str
    total_fields: int
    filled_count: int
    confirmed_count: int
    uncertain_count: int
    suggestions: List[AutofillSuggestionOut]

class AutofillBatchConfirm(BaseModel):
    confirmations: List[Dict[str, Any]] # [{"field_id": "...", "value": "...", "status": "confirmed"}]

# --- Validation & Checklist ---
class ValidationItemOut(BaseModel):
    field_id: Optional[str] = None
    rule_name: str
    is_valid: bool
    error_message: str
    correction_needed: Optional[str] = None
    severity: str
    blocks_export: bool

class ChecklistItemOut(BaseModel):
    id: str
    item_name: str
    item_type: str
    is_satisfied: bool
    required_doc_type: Optional[str] = None
    status: str

class ValidationSummaryResponse(BaseModel):
    form_id: str
    is_ready_for_export: bool
    total_checks: int
    passed_checks: int
    warnings: List[ValidationItemOut]
    errors: List[ValidationItemOut]
    checklist: List[ChecklistItemOut]

# --- PDF Export ---
class ExportResponse(BaseModel):
    export_id: str
    download_url: str
    filename: str
    total_fields_filled: int
    created_at: datetime

