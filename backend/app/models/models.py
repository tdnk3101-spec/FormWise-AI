import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Optional if Supabase auth handles it
    full_name = Column(String, nullable=False)
    role = Column(String, default="user") # 'user', 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")
    forms = relationship("UploadedForm", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Personal info
    full_name = Column(String, nullable=True)
    father_name = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    dob = Column(String, nullable=True) # YYYY-MM-DD
    gender = Column(String, nullable=True)
    category = Column(String, nullable=True) # General, OBC, SC, ST, EWS
    
    # Identity & contact
    aadhaar_masked = Column(String, nullable=True) # e.g. XXXX-XXXX-1234
    pan_number = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Address
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    # Socio-economic & Education
    annual_income = Column(String, nullable=True) # e.g. "120000"
    education_degree = Column(String, nullable=True) # e.g. "B.Tech Computer Science"
    institution_name = Column(String, nullable=True)
    passing_year = Column(String, nullable=True)
    percentage_marks = Column(String, nullable=True) # e.g. "86.5%"
    
    # Financial details
    bank_name = Column(String, nullable=True)
    account_number_masked = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    
    # Extra dynamic fields as JSON
    extra_data = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String, nullable=False) # 'aadhaar', 'pan', 'tenth_marksheet', 'degree', 'income_certificate', 'caste_certificate', 'resume', 'other'
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, nullable=False)
    status = Column(String, default="uploaded") # 'uploaded', 'processing', 'extracted', 'error'
    extracted_data_preview = Column(JSON, default=dict)
    expiry_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    extracted_items = relationship("ExtractedDocumentData", back_populates="document", cascade="all, delete-orphan")

class ExtractedDocumentData(Base):
    __tablename__ = "extracted_document_data"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("user_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String, nullable=False)
    field_value = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
    is_approved = Column(Boolean, default=False)
    is_sensitive = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("UserDocument", back_populates="extracted_items")

class UploadedForm(Base):
    __tablename__ = "uploaded_forms"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, default="Untitled Form")
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, default="pdf") # 'pdf', 'image'
    total_pages = Column(Integer, default=1)
    status = Column(String, default="uploaded") # 'uploaded', 'analyzed', 'autofilled', 'validated', 'completed'
    organization_name = Column(String, nullable=True)
    detected_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="forms")
    pages = relationship("FormPage", back_populates="form", cascade="all, delete-orphan")
    fields = relationship("DetectedField", back_populates="form", cascade="all, delete-orphan")
    validations = relationship("FormValidation", back_populates="form", cascade="all, delete-orphan")
    checklists = relationship("ApplicationChecklist", back_populates="form", cascade="all, delete-orphan")
    completed_records = relationship("CompletedForm", back_populates="form", cascade="all, delete-orphan")

class FormPage(Base):
    __tablename__ = "form_pages"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    width = Column(Float, default=595.0) # standard A4 points
    height = Column(Float, default=842.0)
    image_path = Column(String, nullable=True)
    has_text = Column(Boolean, default=True)
    
    form = relationship("UploadedForm", back_populates="pages")

class DetectedField(Base):
    __tablename__ = "detected_fields"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, default=1)
    field_id_str = Column(String, nullable=False) # e.g. "f_name_p1"
    label = Column(String, nullable=False)
    normalized_name = Column(String, nullable=False) # e.g. "applicant_name"
    field_type = Column(String, default="text") # 'text', 'number', 'date', 'checkbox', 'radio', 'dropdown', 'signature'
    is_required = Column(Boolean, default=False)
    expected_format = Column(String, nullable=True)
    
    # Bounding box in percentage or points [x, y, width, height]
    bbox_x = Column(Float, default=0.0)
    bbox_y = Column(Float, default=0.0)
    bbox_width = Column(Float, default=0.0)
    bbox_height = Column(Float, default=0.0)
    
    # Intelligence metadata
    explanation = Column(Text, nullable=True)
    explanation_te = Column(Text, nullable=True) # Telugu explanation
    explanation_hi = Column(Text, nullable=True) # Hindi explanation
    supporting_doc = Column(String, nullable=True)
    confidence = Column(Float, default=0.9)
    is_uncertain = Column(Boolean, default=False)
    
    # Value filling state
    filled_value = Column(String, nullable=True)
    source_doc = Column(String, nullable=True) # 'Profile', 'Aadhaar Card', etc.
    status = Column(String, default="pending") # 'pending', 'suggested', 'confirmed', 'rejected', 'custom'
    
    form = relationship("UploadedForm", back_populates="fields")

class AutofillSuggestion(Base):
    __tablename__ = "autofill_suggestions"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String, ForeignKey("detected_fields.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_value = Column(String, nullable=False)
    source_type = Column(String, default="profile") # 'profile', 'document'
    source_id = Column(String, nullable=True)
    confidence = Column(Float, default=0.95)
    status = Column(String, default="suggested") # 'suggested', 'accepted', 'edited', 'rejected'
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FormValidation(Base):
    __tablename__ = "form_validations"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String, nullable=True)
    rule_name = Column(String, nullable=False)
    is_valid = Column(Boolean, default=True)
    error_message = Column(String, nullable=False)
    correction_needed = Column(String, nullable=True)
    severity = Column(String, default="error") # 'error', 'warning', 'info'
    blocks_export = Column(Boolean, default=False)
    
    form = relationship("UploadedForm", back_populates="validations")

class ApplicationChecklist(Base):
    __tablename__ = "application_checklists"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String, nullable=False)
    item_type = Column(String, default="field") # 'field', 'document', 'confirmation'
    is_satisfied = Column(Boolean, default=False)
    required_doc_type = Column(String, nullable=True)
    status = Column(String, default="missing") # 'available', 'needs_confirmation', 'missing'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    form = relationship("UploadedForm", back_populates="checklists")

class CompletedForm(Base):
    __tablename__ = "completed_forms"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    form_id = Column(String, ForeignKey("uploaded_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    output_filename = Column(String, nullable=False)
    output_file_path = Column(String, nullable=False)
    total_fields_filled = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    form = relationship("UploadedForm", back_populates="completed_records")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String, nullable=False) # e.g. "upload_document", "extract_ocr", "export_pdf"
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")

class UsageRecord(Base):
    __tablename__ = "usage_records"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, nullable=True, index=True)
    operation_type = Column(String, nullable=False) # 'ocr', 'ai_explain', 'autofill', 'export'
    tokens_used = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

