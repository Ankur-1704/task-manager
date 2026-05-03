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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_verified: bool = True
    dev_otp: str | None = Field(default=None, description="Unused; kept for API compatibility.")
    email_sent: bool | None = Field(
        default=None,
        description="Unused after OTP removal; kept for API compatibility.",
    )


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
