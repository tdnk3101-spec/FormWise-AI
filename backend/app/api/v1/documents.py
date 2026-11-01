import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, UserDocument, ExtractedDocumentData, UserProfile, AuditLog
from app.schemas.schemas import DocumentOut, DocumentExtractResponse, DocumentApprovalRequest, ExtractedFieldItem
from app.core.security import get_current_user
from app.core.storage import StorageService
from app.services.ocr_service import OCRService

router = APIRouter()

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_path, mime_type, file_size = await StorageService.save_upload(
        file=file,
        category="vault",
        user_id=current_user.id
    )

    doc_record = UserDocument(
        user_id=current_user.id,
        document_type=document_type.lower().strip(),
        original_filename=file.filename or "uploaded_document",
        file_path=target_path,
        file_size=file_size,
        mime_type=mime_type,
        status="uploaded",
        expiry_date=expiry_date
    )
    db.add(doc_record)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="upload_vault_document",
        resource_type="user_document",
        resource_id=doc_record.id,
        details={"doc_type": document_type, "filename": file.filename}
    )
    db.add(audit)
    db.commit()
    db.refresh(doc_record)

    return doc_record

@router.get("", response_model=List[DocumentOut])
def list_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UserDocument).filter(UserDocument.user_id == current_user.id).order_by(UserDocument.created_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentOut)
def get_user_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

@router.post("/{document_id}/extract", response_model=DocumentExtractResponse)
def extract_document_ocr(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Extract digital text / OCR layout
    raw_text = OCRService.extract_text_from_file(doc.file_path, doc.mime_type)

    # 2. Extract structured entities based on document type
    parsed_entities = OCRService.parse_document_entities(raw_text, doc.document_type)

    # Clean old extractions for this document
    db.query(ExtractedDocumentData).filter(ExtractedDocumentData.document_id == doc.id).delete()

    extracted_items = []
    sensitive_keys = {"aadhaar_masked", "pan_number", "annual_income"}

    for key, val in parsed_entities.items():
        if val:
            item = ExtractedDocumentData(
                document_id=doc.id,
                user_id=current_user.id,
                field_name=key,
                field_value=str(val),
                confidence=0.95,
                is_approved=False,
                is_sensitive=(key in sensitive_keys)
            )
            db.add(item)
            extracted_items.append(item)

    doc.status = "extracted"
    doc.extracted_data_preview = parsed_entities
    db.commit()

    # Re-fetch items with generated IDs
    items_out = []
    for it in db.query(ExtractedDocumentData).filter(ExtractedDocumentData.document_id == doc.id).all():
        items_out.append(ExtractedFieldItem(
            id=it.id,
            field_name=it.field_name,
            field_value=it.field_value,
            confidence=it.confidence,
            is_approved=it.is_approved,
            is_sensitive=it.is_sensitive
        ))

    return {
        "document_id": doc.id,
        "status": "extracted",
        "extracted_fields": items_out
    }

@router.post("/{document_id}/approve")
def approve_extracted_data(
    document_id: str,
    approval_req: DocumentApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    now = datetime.utcnow()
    for item in approval_req.approvals:
        ext_record = db.query(ExtractedDocumentData).filter(
            ExtractedDocumentData.id == item.field_id,
            ExtractedDocumentData.user_id == current_user.id
        ).first()

        if ext_record:
            ext_record.field_value = item.approved_value
            ext_record.is_approved = item.is_approved
            ext_record.approved_at = now if item.is_approved else None

            # If user approves the value, synchronize to primary verified profile
            if item.is_approved and hasattr(profile, ext_record.field_name):
                setattr(profile, ext_record.field_name, item.approved_value)

    db.commit()
    return {"status": "success", "message": "Extracted values approved and updated to profile"}

@router.delete("/{document_id}")
def delete_user_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    StorageService.delete_file(doc.file_path, current_user.id)
    db.delete(doc)

    audit = AuditLog(
        user_id=current_user.id,
        action="delete_vault_document",
        resource_type="user_document",
        resource_id=document_id,
        details={"filename": doc.original_filename}
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": "Document deleted successfully"}
