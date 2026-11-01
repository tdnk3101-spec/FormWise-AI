import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import (
    User, UploadedForm, DetectedField, UserDocument,
    FormValidation, ApplicationChecklist, CompletedForm, AuditLog
)
from app.schemas.schemas import (
    ValidationSummaryResponse, ValidationItemOut, ChecklistItemOut, ExportResponse
)
from app.core.security import get_current_user
from app.services.validation_engine import ValidationEngine
from app.services.pdf_generator import PDFGeneratorService

router = APIRouter()

@router.post("/{form_id}/validate", response_model=ValidationSummaryResponse)
def validate_form(
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

    fields = db.query(DetectedField).filter(DetectedField.form_id == form_id).all()
    user_docs = db.query(UserDocument).filter(UserDocument.user_id == current_user.id).all()

    result = ValidationEngine.validate_form(fields, user_docs)

    # Persist validations
    db.query(FormValidation).filter(FormValidation.form_id == form_id).delete()
    for err in result["errors"]:
        v = FormValidation(
            form_id=form_id,
            field_id=err["field_id"],
            rule_name=err["rule_name"],
            is_valid=False,
            error_message=err["error_message"],
            correction_needed=err["correction_needed"],
            severity="error",
            blocks_export=err["blocks_export"]
        )
        db.add(v)

    for warn in result["warnings"]:
        v = FormValidation(
            form_id=form_id,
            field_id=warn["field_id"],
            rule_name=warn["rule_name"],
            is_valid=False,
            error_message=warn["error_message"],
            correction_needed=warn["correction_needed"],
            severity="warning",
            blocks_export=warn["blocks_export"]
        )
        db.add(v)

    # Persist checklist items
    db.query(ApplicationChecklist).filter(ApplicationChecklist.form_id == form_id).delete()
    checklist_outs = []
    for chk in result["checklist"]:
        c = ApplicationChecklist(
            form_id=form_id,
            user_id=current_user.id,
            item_name=chk["item_name"],
            item_type=chk["item_type"],
            is_satisfied=chk["is_satisfied"],
            required_doc_type=chk["required_doc_type"],
            status=chk["status"]
        )
        db.add(c)
        checklist_outs.append(ChecklistItemOut(
            id=chk["id"],
            item_name=chk["item_name"],
            item_type=chk["item_type"],
            is_satisfied=chk["is_satisfied"],
            required_doc_type=chk["required_doc_type"],
            status=chk["status"]
        ))

    form.status = "validated"
    db.commit()

    return {
        "form_id": form_id,
        "is_ready_for_export": result["is_ready_for_export"],
        "total_checks": result["total_checks"],
        "passed_checks": result["passed_checks"],
        "errors": [ValidationItemOut(**e) for e in result["errors"]],
        "warnings": [ValidationItemOut(**w) for w in result["warnings"]],
        "checklist": checklist_outs
    }

@router.get("/{form_id}/checklist")
def get_form_checklist(
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

    items = db.query(ApplicationChecklist).filter(ApplicationChecklist.form_id == form_id).all()
    return items

@router.post("/{form_id}/export", response_model=ExportResponse)
def export_completed_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form or not os.path.exists(form.file_path):
        raise HTTPException(status_code=404, detail="Original form file not found")

    fields = db.query(DetectedField).filter(DetectedField.form_id == form_id).all()

    # Generate completed PDF
    out_path, out_filename, filled_count = PDFGeneratorService.generate_filled_pdf(
        original_pdf_path=form.file_path,
        fields=fields,
        form_title=form.title,
        user_id=current_user.id
    )

    completed_record = CompletedForm(
        form_id=form_id,
        user_id=current_user.id,
        output_filename=out_filename,
        output_file_path=out_path,
        total_fields_filled=filled_count
    )
    db.add(completed_record)
    form.status = "completed"

    audit = AuditLog(
        user_id=current_user.id,
        action="export_completed_pdf",
        resource_type="completed_form",
        resource_id=completed_record.id,
        details={"output_filename": out_filename, "fields_filled": filled_count}
    )
    db.add(audit)
    db.commit()
    db.refresh(completed_record)

    return {
        "export_id": completed_record.id,
        "download_url": f"/api/v1/validation/{form_id}/export/{completed_record.id}/download",
        "filename": out_filename,
        "total_fields_filled": filled_count,
        "created_at": completed_record.created_at
    }

@router.get("/{form_id}/export/{export_id}/download")
def download_completed_pdf(
    form_id: str,
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(CompletedForm).filter(
        CompletedForm.id == export_id,
        CompletedForm.form_id == form_id,
        CompletedForm.user_id == current_user.id
    ).first()
    if not record or not os.path.exists(record.output_file_path):
        raise HTTPException(status_code=404, detail="Exported file not found")

    return FileResponse(
        path=record.output_file_path,
        filename=record.output_filename,
        media_type="application/pdf"
    )

