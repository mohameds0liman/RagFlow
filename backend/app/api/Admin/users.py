from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserAccess, UserRole, Chatbot
from app.api.auth import require_admin

router = APIRouter(prefix="/admin/users", tags=["Users"])



###########################################################
# Schema
###########################################################
class UserListItem(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    daily_message_limit: int | None
    messages_used_today: int
    stt_enabled: bool
    tts_enabled: bool
    initial_access_granted: bool
    granted_by: str | None
    granted_at: str | None
    created_at: str


class UserDetailItem(UserListItem):
    chat_sessions_count: int = 0
    chatbots_count: int = 0


class FeaturesUpdate(BaseModel):
    stt_enabled: bool | None = None
    tts_enabled: bool | None = None
    daily_message_limit: int | None = None


class RoleUpdate(BaseModel):
    role: str


class KBAccessGrant(BaseModel):
    document_store_id: str
    granted_by: str | None = None


###########################################################
# Helpers
###########################################################
def _chatbot_access_to_dict(access: UserAccess) -> dict:
    return {
        "id": access.id,
        "user_id": access.user_id,
        "chatbot_id": access.chatbot_id,
        "granted_at": access.granted_at.isoformat() if access.granted_at else None,
    }
###########################################################


@router.get("", dependencies=[Depends(require_admin)])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return {
        "total": db.query(User).count(),
        "users": [_user_to_dict(u) for u in users],
    }


@router.get("/{user_id}", dependencies=[Depends(require_admin)])
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_detail_to_dict(user)


@router.patch("/{user_id}/access", dependencies=[Depends(require_admin)])
def update_access(
    user_id: str,
    granted: bool = Body(..., embed=True),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.initial_access_granted = granted
    user.granted_by = admin_user.id
    user.granted_at = datetime.utcnow()
    db.commit()
    return {"status": "updated", "initial_access_granted": granted}


@router.patch("/{user_id}/features", dependencies=[Depends(require_admin)])
def update_features(
    user_id: str,
    features: FeaturesUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if features.stt_enabled is not None:
        user.stt_enabled = features.stt_enabled
    if features.tts_enabled is not None:
        user.tts_enabled = features.tts_enabled
    if features.daily_message_limit is not None:
        user.daily_message_limit = features.daily_message_limit
    db.commit()
    return {"status": "updated", "stt_enabled": user.stt_enabled, "tts_enabled": user.tts_enabled, "daily_message_limit": user.daily_message_limit}


@router.patch("/{user_id}/role", dependencies=[Depends(require_admin)])
def update_role(
    user_id: str,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        role = UserRole(role_data.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = role
    db.commit()
    return {"status": "updated", "role": role.value}


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@router.get("/{user_id}/chatbot-access", dependencies=[Depends(require_admin)])
def list_chatbot_access(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    accesses = db.query(UserAccess).filter(UserAccess.user_id == user_id).all()
    return {"accesses": [_chatbot_access_to_dict(a) for a in accesses]}


@router.post("/{user_id}/chatbot-access", dependencies=[Depends(require_admin)])
def grant_chatbot_access(
    user_id: str,
    chatbot_id: str = Body(..., embed=True),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    existing = db.query(UserAccess).filter(
        UserAccess.user_id == user_id,
        UserAccess.chatbot_id == chatbot_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Access already granted")
    access = UserAccess(
        user_id=user_id,
        chatbot_id=chatbot_id,
        granted_at=datetime.utcnow(),
    )
    db.add(access)
    db.commit()
    db.refresh(access)
    return {"status": "granted", "access": _chatbot_access_to_dict(access)}


@router.delete("/{user_id}/chatbot-access/{chatbot_id}", dependencies=[Depends(require_admin)])
def revoke_chatbot_access(user_id: str, chatbot_id: str, db: Session = Depends(get_db)):
    access = db.query(UserAccess).filter(
        UserAccess.user_id == user_id,
        UserAccess.chatbot_id == chatbot_id
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access not found")
    db.delete(access)
    db.commit()
    return {"status": "revoked"}


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "daily_message_limit": user.daily_message_limit,
        "messages_used_today": user.messages_used_today,
        "stt_enabled": user.stt_enabled,
        "tts_enabled": user.tts_enabled,
        "initial_access_granted": user.initial_access_granted,
        "granted_by": user.granted_by,
        "granted_at": user.granted_at.isoformat() if user.granted_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _user_detail_to_dict(user: User) -> dict:
    base = _user_to_dict(user)
    base["chat_sessions_count"] = len(user.chat_sessions) if user.chat_sessions else 0
    base["chatbots_count"] = len(user.chatbots) if user.chatbots else 0
    return base


def _kb_access_to_dict(access: UserAccess) -> dict:
    return {
        "id": access.id,
        "user_id": access.user_id,
        "document_store_id": access.document_store_id,
        "granted_at": access.granted_at.isoformat() if access.granted_at else None,
    }
