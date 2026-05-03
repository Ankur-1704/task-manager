from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.limiter import limiter
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_by_email(db: Session, email: str) -> User | None:
    """Match stored email case-insensitively (legacy rows may differ in casing)."""
    normalized = (email or "").strip().lower()
    if not normalized:
        return None
    return db.query(User).filter(func.lower(User.email) == normalized).first()


def _accept_invitation(token: str, user: User, db: Session) -> None:
    invitation = (
        db.query(Invitation)
        .filter(
            Invitation.token == token,
            Invitation.is_accepted == False,  # noqa: E712
            Invitation.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not invitation:
        return
    existing = (
        db.query(Member)
        .filter(Member.project_id == invitation.project_id, Member.user_id == user.id)
        .first()
    )
    if not existing:
        db.add(Member(project_id=invitation.project_id, user_id=user.id, role=invitation.role))
    invitation.is_accepted = True


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register",
    description="Creates a verified account immediately (no email OTP).",
)
@limiter.limit("10/minute")
def signup(
    request: Request,
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    existing = _user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_verified=True,
    )
    db.add(user)
    db.flush()

    if payload.invitation_token:
        _accept_invitation(payload.invitation_token, user, db)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        is_verified=True,
        dev_otp=None,
        email_sent=None,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = _user_by_email(db, payload.email)
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        is_verified=user.is_verified,
        dev_otp=None,
        email_sent=None,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
