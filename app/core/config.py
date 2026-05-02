from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env from the repo root so MAIL_* load correctly even when uvicorn's cwd is elsewhere.
# (Relative env_file=".env" alone uses the process cwd — scripts vs API could disagree.)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ROOT_ENV = _PROJECT_ROOT / ".env"
_CWD_ENV = Path.cwd() / ".env"
# Prefer repo-root `.env` so MAIL_* match `scripts/test_smtp.py` even when uvicorn cwd is elsewhere.
if _ROOT_ENV.is_file():
    _DOTENV_FILES: tuple[Path, ...] = (_ROOT_ENV,)
elif _CWD_ENV.is_file():
    _DOTENV_FILES = (_CWD_ENV,)
else:
    _DOTENV_FILES = ()


class Settings(BaseSettings):
    """Load configuration from the process environment and optional `.env` file(s).

    **Where values come from (highest priority wins for the same key):**
    1. **Environment / “App settings”** on your host (Railway, Render, Azure App Configuration,
       Heroku config vars, Docker `-e`, systemd `Environment=`, etc.) — these are normal OS
       environment variables such as `MAIL_USERNAME`, `MAIL_PASSWORD`.
    2. **`.env` file** at the project root (or cwd fallback), used for local dev and when the host
       does not set a variable.
    3. **Defaults in this class** (e.g. `MAIL_USERNAME: str = ""`) — only used when a key is
       still missing. Empty strings in the source code are *not* “the config”; they mean “unset”.
    """

    model_config = SettingsConfigDict(
        env_file=_DOTENV_FILES if _DOTENV_FILES else None,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    DATABASE_URL: str

    # SQLAlchemy pool — raise when scaling traffic / workers (see session.py)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Email / SMTP — defaults here mean “unset”; real values are read from env / .env
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    # False = STARTTLS on MAIL_PORT (usually 587). True = implicit SSL (usually port 465).
    MAIL_USE_SSL: bool = False
    # Print SMTP wire protocol to stderr (troubleshooting only).
    MAIL_SMTP_DEBUG: bool = False
    # If true, when SMTP fails, log the OTP in server logs (debug only; never in production).
    LOG_OTP_ON_SMTP_FAIL: bool = False
    # If true, signup/resend JSON includes `dev_otp` so you can verify without mail (local dev ONLY).
    DEV_EXPOSE_OTP_IN_RESPONSE: bool = False

    # OTP SMTP: use multipart plain+HTML (same MIME shape as scripts/test_smtp.py). Set true for text-only.
    OTP_EMAIL_PLAIN_ONLY: bool = False

    # Frontend base URL (used in invitation links)
    FRONTEND_URL: str = "http://localhost:5174"

    @model_validator(mode="after")
    def mail_from_matches_account(self) -> "Settings":
        # Gmail (and most SMTP) requires From to match the authenticated mailbox.
        if self.MAIL_USERNAME and not (self.MAIL_FROM or "").strip():
            self.MAIL_FROM = self.MAIL_USERNAME.strip()
        return self


settings = Settings()
