import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, UploadedForm, FormPage, DetectedField, AuditLog
from app.schemas.schemas import (
    FormOut, DetectedFieldOut, DetectedFieldUpdate,
    FieldExplainRequest, FieldExplainResponse,
    FormChatRequest, FormChatResponse
)
from app.core.security import get_current_user
from app.core.storage import StorageService
from app.core.config import settings
from app.services.form_analyzer import FormAnalyzerService
from app.services.ai_orchestrator import AIOrchestrator

router = APIRouter()

@router.post("/upload", response_model=FormOut)
async def upload_form(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_path, mime_type, file_size = await StorageService.save_upload(
        file=file,
        category="forms",
        user_id=current_user.id
    )

    form_type = "pdf" if "pdf" in mime_type else "image"
    form_record = UploadedForm(
        user_id=current_user.id,
        title=title or (file.filename or "Application Form").rsplit(".", 1)[0],
        original_filename=file.filename or "form.pdf",
        file_path=target_path,
        file_type=form_type,
        status="uploaded"
    )
    db.add(form_record)
    db.commit()
    db.refresh(form_record)

    # Immediately run initial structure analysis
    try:
        analysis = FormAnalyzerService.analyze_pdf_form(form_record.file_path, form_record.id)
        form_record.total_pages = analysis["total_pages"]
        form_record.title = title or analysis["title"]
        form_record.organization_name = analysis["organization_name"]
        form_record.status = "analyzed"

        # Save pages
        for p in analysis["pages"]:
            page_obj = FormPage(
                form_id=form_record.id,
                page_number=p["page_number"],
                width=p["width"],
                height=p["height"],
                image_path=p["image_path"],
                has_text=p["has_text"]
            )
            db.add(page_obj)

        # Save fields
        for f in analysis["fields"]:
            field_obj = DetectedField(
                form_id=form_record.id,
                page_number=f["page_number"],
                field_id_str=f["field_id_str"],
                label=f["label"],
                normalized_name=f["normalized_name"],
                field_type=f["field_type"],
                is_required=f["is_required"],
                expected_format=f["expected_format"],
                bbox_x=f["bbox_x"],
                bbox_y=f["bbox_y"],
                bbox_width=f["bbox_width"],
                bbox_height=f["bbox_height"],
                explanation=f["explanation"],
                supporting_doc=f["supporting_doc"],
                confidence=f["confidence"],
                is_uncertain=f["is_uncertain"],
                status="pending"
            )
            db.add(field_obj)

        db.commit()
        db.refresh(form_record)
    except Exception as e:
        print(f"[Form Upload Analysis Exception]: {e}")
        form_record.status = "uploaded"
        db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="upload_form",
        resource_type="uploaded_form",
        resource_id=form_record.id,
        details={"title": form_record.title, "filename": file.filename}
    )
    db.add(audit)
    db.commit()

    return form_record

@router.get("", response_model=List[FormOut])
def list_user_forms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UploadedForm).filter(UploadedForm.user_id == current_user.id).order_by(UploadedForm.created_at.desc()).all()

@router.get("/{form_id}", response_model=FormOut)
def get_form_details(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.get("/{form_id}/preview/{page_num}")
def get_form_page_preview(
    form_id: str,
    page_num: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    preview_path = os.path.join(settings.STORAGE_DIR, "forms", "previews", form_id, f"page_{page_num}.png")
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Page preview image not found")

    return FileResponse(preview_path, media_type="image/png")

@router.put("/{form_id}/fields/{field_id}", response_model=DetectedFieldOut)
def update_form_field(
    form_id: str,
    field_id: str,
    field_update: DetectedFieldUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    field = db.query(DetectedField).filter(
        DetectedField.id == field_id,
        DetectedField.form_id == form_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if field_update.filled_value is not None:
        field.filled_value = field_update.filled_value
    if field_update.status is not None:
        field.status = field_update.status

    db.commit()
    db.refresh(field)
    return field

@router.post("/{form_id}/explain", response_model=FieldExplainResponse)
def explain_field(
    form_id: str,
    req: FieldExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    field = db.query(DetectedField).filter(
        DetectedField.id == req.field_id,
        DetectedField.form_id == form_id
    ).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    result = AIOrchestrator.explain_field(
        field_label=field.label,
        normalized_name=field.normalized_name,
        form_title=form.title,
        language=req.language
    )

    return {
        "field_id": field.id,
        "label": field.label,
        "meaning": result.get("meaning", field.explanation or "Official form field"),
        "format_example": result.get("format_example", "[Example] Standard format"),
        "supporting_doc": result.get("supporting_doc", field.supporting_doc),
        "warnings": result.get("warnings", "Ensure details match verified certificates"),
        "language": req.language
    }

@router.post("/{form_id}/chat", response_model=FormChatResponse)
def form_assistant_chat(
    form_id: str,
    req: FormChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    field_ctx = None
    if req.field_id:
        field = db.query(DetectedField).filter(
            DetectedField.id == req.field_id,
            DetectedField.form_id == form_id
        ).first()
        if field:
            field_ctx = {
                "label": field.label,
                "normalized_name": field.normalized_name,
                "type": field.field_type,
                "required": field.is_required
            }

    chat_res = AIOrchestrator.chat_with_form_assistant(
        message=req.message,
        field_context=field_ctx,
        language=req.language
    )
    return chat_res
