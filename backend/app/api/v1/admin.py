from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, UserDocument, UploadedForm, CompletedForm, AuditLog, UsageRecord
from app.core.security import get_current_admin
from app.core.config import settings

router = APIRouter()

@router.get("/stats")
def get_admin_system_stats(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_documents = db.query(UserDocument).count()
    total_forms = db.query(UploadedForm).count()
    total_exports = db.query(CompletedForm).count()
    total_logs = db.query(AuditLog).count()

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()

    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_configured": bool(settings.LLM_API_KEY),
        "counts": {
            "total_users": total_users,
            "total_vault_documents": total_documents,
            "total_forms_processed": total_forms,
            "total_completed_exports": total_exports,
            "total_audit_events": total_logs
        },
        "recent_system_audits": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "created_at": log.created_at
            }
            for log in recent_logs
        ]
    }

