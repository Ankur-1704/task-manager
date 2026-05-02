from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _normalize_email_input(value: object) -> object:
    if isinstance(value, str):
        return value.strip().lower()
    return value


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    invitation_token: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _normalize_email_input(value)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be blank")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _normalize_email_input(value)


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _normalize_email_input(value)


class OtpResendRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _normalize_email_input(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_verified: bool = True
    # Present only when settings.DEV_EXPOSE_OTP_IN_RESPONSE is true (never enable in production).
    dev_otp: str | None = None
    # Signup only: server handed off verification mail to SMTP (inbox arrival not guaranteed).
    email_sent: bool | None = Field(
        default=None,
        description="Signup: True if SMTP accepted the message. False if not configured or failed.",
    )


class OtpResendResponse(BaseModel):
    message: str
    email_sent: bool = Field(
        ...,
        description="True if SMTP accepted the OTP email for delivery.",
    )
    dev_otp: str | None = Field(
        default=None,
        description="Same 6-digit code now stored for verification when DEV_EXPOSE_OTP_IN_RESPONSE is enabled.",
    )


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VerifyEmailResponse(BaseModel):
    """Issued after OTP verification so unauthenticated resume flows receive a JWT."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
