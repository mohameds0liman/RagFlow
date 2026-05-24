from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.api.auth import require_admin, validate_password_strength, verify_password, hash_password
router = APIRouter(prefix="/admin", tags=["Admin Profile"])


##########################################################################
# Pydantic Schemas
##########################################################################
class UpdateProfileRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
##########################################################################
# Helpers
##########################################################################
def _profile_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "is_verified": user.is_verified,
        "stt_enabled": user.stt_enabled,
        "tts_enabled": user.tts_enabled,
        "daily_message_limit": user.daily_message_limit,
        "messages_used_today": user.messages_used_today,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
##########################################################################
# Endpoints
##########################################################################
@router.get("/profile")
def get_profile(
    admin_user: User = Depends(require_admin),
):
    return {"status": "ok", "profile": _profile_to_dict(admin_user)}
@router.put("/profile")
def update_profile(
    payload: UpdateProfileRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.username is not None:
        existing = db.query(User).filter(
            User.username == payload.username,
            User.id != admin_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken")
        admin_user.username = payload.username
    if payload.email is not None:
        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != admin_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        admin_user.email = payload.email
    db.commit()
    db.refresh(admin_user)
    return {"status": "updated", "profile": _profile_to_dict(admin_user)}

@router.patch("/profile/password")
def change_password(
    payload: ChangePasswordRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, admin_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    validate_password_strength(payload.new_password)
    admin_user.password_hash = hash_password(payload.new_password)
    admin_user.refresh_token_hash = None
    db.commit()
    return {"status": "password_updated"}