from fastapi import APIRouter, Depends, HTTPException, Response, Request, Body
# HTTPBearer -> security scheme that extracts Bearer(حاملها) token from Authorization header
# HTTPAuthorizationCredentials -> Object containing the extracted token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
import hashlib
import secrets
import re
import uuid

from app.db.session import get_db
from app.db.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

#############################################################################################################
#############################################################################################################
#############################################################################################################
class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: datetime
    iat: datetime


def get_token_settings() -> dict:
    return {
        "secret_key": "ragflow-super-secret-jwt-key-change-in-production",
        "algorithm": "HS256",
        "access_token_expire_minutes": 30,
        "refresh_token_expire_days": 7,
    }


def create_access_token(user_id: str, role: str) -> tuple[str, datetime]:
    settings = get_token_settings()
    now = datetime.utcnow()
    exp = now + timedelta(minutes=settings["access_token_expire_minutes"])
    payload = {
        "sub": user_id,
        "role": role,
        "exp": exp,
        "iat": now,
        "type": "access",
    }
    import base64, json
    import hmac
    header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": settings["algorithm"], "typ": "JWT"}).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, default=str).encode()).decode().rstrip("=")
    signature = hmac.new(settings["secret_key"].encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig_b64}", exp


def create_refresh_token() -> tuple[str, str, datetime]:
    raw_token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    settings = get_token_settings()
    exp = datetime.utcnow() + timedelta(days=settings["refresh_token_expire_days"])
    return raw_token, token_hash, exp


def decode_access_token(token: str) -> TokenPayload | None:
    settings = get_token_settings()
    try:
        import base64, json, hmac
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        expected_sig = hmac.new(settings["secret_key"].encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        exp = datetime.fromisoformat(payload["exp"]) if isinstance(payload["exp"], str) else datetime.utcfromtimestamp(payload["exp"])
        if datetime.utcnow() > exp:
            return None
        return TokenPayload(sub=payload["sub"], role=payload["role"], exp=exp, iat=datetime.fromisoformat(payload["iat"]) if isinstance(payload["iat"], str) else datetime.utcfromtimestamp(payload["iat"]))
    except Exception:
        return None
#############################################################################################################
#############################################################################################################
#############################################################################################################
def hash_password(password: str) -> str:
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    import bcrypt
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:  ## if the user does not have token created before
        raise HTTPException(status_code=401, detail="Missing authentication token")
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload.sub).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.query(User).filter(User.id == payload.sub).first()
    if not user or not user.is_active:
        return None
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_user(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.user:
        raise HTTPException(status_code=403, detail="User access required")
    return user

def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain letters")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain numbers")


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already registered")
    validate_password_strength(payload.password)
    user = User(
        id=str(uuid.uuid4()),
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password), ## we can add the real password but this more safe 
        role=UserRole.user,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "status": "registered",
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
    }


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    access_token, exp = create_access_token(user.id, user.role.value)
    raw_refresh, refresh_hash, refresh_exp = create_refresh_token()
    user.refresh_token_hash = refresh_hash
    user.last_login_at = datetime.utcnow()
    db.commit()
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=int((refresh_exp - datetime.utcnow()).total_seconds()),
        path="/",
    )
    return {
        "status": "logged_in",
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_at": exp.isoformat(),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_verified": user.is_verified,
        },
    }


@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        if user.refresh_token_hash == token_hash:
            user.refresh_token_hash = None
            db.commit()
    response.delete_cookie(key="refresh_token", path="/")
    return {"status": "logged_out"}


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    user = db.query(User).filter(User.refresh_token_hash == token_hash).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    access_token, exp = create_access_token(user.id, user.role.value)
    raw_refresh, refresh_hash, refresh_exp = create_refresh_token()
    user.refresh_token_hash = refresh_hash
    db.commit()
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=int((refresh_exp - datetime.utcnow()).total_seconds()),
        path="/",
    )
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_at": exp.isoformat(),
    }

# sends email  - later set email to send from to the user email
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"status": "email_sent", "message": "If the email exists, a reset link has been sent"}
    reset_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    user.reset_password_token = token_hash
    user.reset_password_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    return {"status": "email_sent", "message": "If the email exists, a reset link has been sent"}

# on press the email it send him back to reset password page 
# set the new one and replace the hash of it with the Old password
@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    user = db.query(User).filter(
        User.reset_password_token == token_hash,
        User.reset_password_expires_at > datetime.utcnow(),
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    validate_password_strength(payload.new_password)
    user.password_hash = hash_password(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    user.refresh_token_hash = None
    db.commit()
    return {"status": "password_reset"}