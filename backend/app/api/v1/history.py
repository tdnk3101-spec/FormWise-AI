from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.models import User, UploadedForm, CompletedForm, AuditLog
from app.core.security import get_current_user
from app.core.storage import StorageService

router = APIRouter()

@router.get("")
def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    forms = db.query(UploadedForm).filter(UploadedForm.user_id == current_user.id).order_by(UploadedForm.created_at.desc()).all()
    completed = db.query(CompletedForm).filter(CompletedForm.user_id == current_user.id).order_by(CompletedForm.created_at.desc()).all()
    logs = db.query(AuditLog).filter(AuditLog.user_id == current_user.id).order_by(AuditLog.created_at.desc()).limit(20).all()

    form_list = []
    for f in forms:
        comp_record = next((c for c in completed if c.form_id == f.id), None)
        form_list.append({
            "id": f.id,
            "title": f.title,
            "filename": f.original_filename,
            "status": f.status,
            "total_pages": f.total_pages,
            "fields_count": len(f.fields),
            "completed_export_id": comp_record.id if comp_record else None,
            "completed_filename": comp_record.output_filename if comp_record else None,
            "created_at": f.created_at,
            "updated_at": f.updated_at
        })

    return {
        "forms": form_list,
        "completed_count": len(completed),
        "recent_activities": [
            {
                "id": l.id,
                "action": l.action,
                "resource_type": l.resource_type,
                "created_at": l.created_at
            } for l in logs
        ]
    }

@router.delete("/{form_id}")
def delete_form_history(
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

    StorageService.delete_file(form.file_path, current_user.id)
    db.delete(form)

    audit = AuditLog(
        user_id=current_user.id,
        action="delete_form_draft",
        resource_type="uploaded_form",
        resource_id=form_id,
        details={"title": form.title}
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": "Form draft deleted"}

