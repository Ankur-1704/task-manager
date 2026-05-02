import logging
import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings as app_settings
from app.core.limiter import limiter
from app.core.email import send_otp_email
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.otp import OTPVerification
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    OtpResendRequest,
    OtpResendResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailResponse,
    VerifyOTPRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

OTP_EXPIRE_MINUTES = 10


def _user_by_email(db: Session, email: str) -> User | None:
    """Match stored email case-insensitively (legacy rows may differ in casing)."""
    normalized = (email or "").strip().lower()
    if not normalized:
        return None
    return db.query(User).filter(func.lower(User.email) == normalized).first()


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _create_and_send_otp(user: User, db: Session) -> tuple[bool, str]:
    """Replace any unused OTP for this user, persist a new 6-digit code, email it, return (smtp_ok, code).

    The new ``otp_code`` is the only value ``POST /auth/verify-email`` will accept (until it expires or
    another signup/resend replaces it). Caller must ``commit`` the session so the row is visible to verify.
    """
    db.query(OTPVerification).filter(
        OTPVerification.user_id == user.id, OTPVerification.is_used == False  # noqa: E712
    ).delete()
    db.flush()

    otp = OTPVerification(
        user_id=user.id,
        otp_code=_generate_otp(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    db.flush()

    ok = send_otp_email(user.email, user.name, otp.otp_code)
    return ok, otp.otp_code


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
    description=(
        "Creates an account and emails a 6-digit OTP via **SMTP** when `MAIL_USERNAME`/`MAIL_PASSWORD` are set (same as "
        "`scripts/test_smtp.py`). **email_sent** is `true` only if the server handed the message to SMTP - it does **not** "
        "guarantee inbox delivery (spam filters, wrong account, etc.). "
        "If `email_sent` is `false`, fix `MAIL_*` or use `DEV_EXPOSE_OTP_IN_RESPONSE` locally."
    ),
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
        is_verified=False,
    )
    db.add(user)
    db.flush()

    sent, otp_code = _create_and_send_otp(user, db)

    if payload.invitation_token:
        _accept_invitation(payload.invitation_token, user, db)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        is_verified=False,
        dev_otp=otp_code if app_settings.DEV_EXPOSE_OTP_IN_RESPONSE else None,
        email_sent=sent,
    )


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
    summary="Verify email with OTP",
    description=(
        "Checks the **latest unused, unexpired** OTP for this user (from signup or **POST /auth/resend-otp**). "
        "Each resend replaces the previous pending code."
    ),
)
@limiter.limit("15/minute")
def verify_email(
    request: Request,
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = _user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.user_id == user.id,
            OTPVerification.otp_code == payload.otp_code,
            OTPVerification.is_used == False,  # noqa: E712
            OTPVerification.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )

    otp.is_used = True
    user.is_verified = True
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=user.id)
    return VerifyEmailResponse(access_token=token, user=user)


@router.post(
    "/resend-otp",
    response_model=OtpResendResponse,
    status_code=status.HTTP_200_OK,
    summary="Send verification OTP email again",
    description=(
        "Invalidates any previous **unused** OTP for this account, **stores a new 6-digit code** in the database, "
        "then emails it via SMTP. Use that new code on **POST /auth/verify-email** (old codes no longer work). "
        "**email_sent** is whether SMTP accepted the message. If mail fails and `dev_otp` is returned, that value "
        "matches the stored code (local dev only)."
    ),
)
@limiter.limit("15/minute")
def resend_otp(
    request: Request,
    payload: OtpResendRequest,
    db: Session = Depends(get_db),
):
    user = _user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified"
        )
    sent, otp_code = _create_and_send_otp(user, db)
    logger.info(
        "[AUTH] resend_otp email=%s smtp_accepted=%s dev_expose_otp_in_response=%s",
        (payload.email or "").strip().lower(),
        sent,
        app_settings.DEV_EXPOSE_OTP_IN_RESPONSE,
    )
    if not sent:
        if app_settings.DEV_EXPOSE_OTP_IN_RESPONSE:
            db.commit()
            return OtpResendResponse(
                message="SMTP failed - use dev_otp to verify (local dev only).",
                email_sent=False,
                dev_otp=otp_code,
            )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Could not send the verification email. Check server mail configuration (MAIL_* env vars), "
                "restart the API, and try again."
            ),
        )
    db.commit()
    return OtpResendResponse(
        message="OTP sent successfully",
        email_sent=True,
        dev_otp=otp_code if app_settings.DEV_EXPOSE_OTP_IN_RESPONSE else None,
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
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in. Check your inbox or use 'Resend code' on the verification page.",
        )
    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, is_verified=True)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
