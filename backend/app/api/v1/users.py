from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, UserProfile, AuditLog
from app.schemas.schemas import UserProfileOut, UserProfileUpdate
from app.core.security import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserProfileOut)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id, full_name=current_user.full_name, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileOut)
def update_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    # If full_name or email changed, update parent user model as well
    if profile_in.full_name:
        current_user.full_name = profile_in.full_name
    if profile_in.email:
        current_user.email = profile_in.email

    audit = AuditLog(
        user_id=current_user.id,
        action="profile_updated",
        resource_type="user_profile",
        resource_id=profile.id,
        details={"updated_fields": list(update_data.keys())}
    )
    db.add(audit)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/settings")
def get_user_settings(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "two_factor_enabled": False,
        "data_retention_policy": "User Controlled (DPDP Act compliant)",
        "preferred_language": "en",
        "supported_languages": [
            {"code": "en", "name": "English"},
            {"code": "te", "name": "Telugu (తెలుగు)"},
            {"code": "hi", "name": "Hindi (हिन्दी)"}
        ]
    }

