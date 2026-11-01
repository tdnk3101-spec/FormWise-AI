from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.models import User, UploadedForm, DetectedField, UserProfile, ExtractedDocumentData, AutofillSuggestion, AuditLog
from app.schemas.schemas import AutofillRequest, AutofillResponse, AutofillBatchConfirm
from app.core.security import get_current_user
from app.services.autofill_engine import AutofillEngine

router = APIRouter()

@router.post("/{form_id}/autofill", response_model=AutofillResponse)
def trigger_autofill(
    form_id: str,
    req: AutofillRequest,
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
    if not fields:
        raise HTTPException(status_code=400, detail="No fields detected for this form yet")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    extracted_docs = db.query(ExtractedDocumentData).filter(ExtractedDocumentData.user_id == current_user.id).all()

    result = AutofillEngine.match_fields(
        detected_fields=fields,
        profile=profile,
        extracted_docs=extracted_docs,
        mode=req.mode
    )

    # Persist suggestions to db and update fields if automatically filled
    # Clear previous suggestions
    db.query(AutofillSuggestion).filter(AutofillSuggestion.form_id == form_id).delete()

    for sugg in result["suggestions"]:
        if sugg["suggested_value"]:
            sugg_record = AutofillSuggestion(
                form_id=form_id,
                field_id=sugg["field_id"],
                user_id=current_user.id,
                suggested_value=sugg["suggested_value"],
                source_type=sugg["source"],
                confidence=sugg["confidence"],
                status=sugg["status"],
                notes=sugg["reason"]
            )
            db.add(sugg_record)

            # If mode was automatic and eligible for auto-fill, update field immediately
            if sugg["is_auto_filled"]:
                fld = next((f for f in fields if f.id == sugg["field_id"]), None)
                if fld:
                    fld.filled_value = sugg["suggested_value"]
                    fld.source_doc = sugg["source"]
                    fld.status = "confirmed"

    form.status = "autofilled"
    audit = AuditLog(
        user_id=current_user.id,
        action="trigger_autofill",
        resource_type="uploaded_form",
        resource_id=form_id,
        details={"mode": req.mode, "fields_matched": len([s for s in result['suggestions'] if s['suggested_value']])}
    )
    db.add(audit)
    db.commit()

    return {
        "form_id": form_id,
        "mode": req.mode,
        "total_fields": result["total_fields"],
        "filled_count": result["filled_count"],
        "confirmed_count": result["confirmed_count"],
        "uncertain_count": result["uncertain_count"],
        "suggestions": result["suggestions"]
    }

@router.post("/{form_id}/confirm")
def confirm_autofill_batch(
    form_id: str,
    batch_req: AutofillBatchConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(UploadedForm).filter(
        UploadedForm.id == form_id,
        UploadedForm.user_id == current_user.id
    ).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    confirmed_count = 0
    for item in batch_req.confirmations:
        f_id = item.get("field_id")
        val = item.get("value")
        stat = item.get("status", "confirmed")

        field = db.query(DetectedField).filter(
            DetectedField.id == f_id,
            DetectedField.form_id == form_id
        ).first()

        if field:
            field.filled_value = val
            field.status = stat
            confirmed_count += 1

    db.commit()
    return {"status": "success", "confirmed_count": confirmed_count}

