import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, dashboard, invitations, projects, tasks
from app.core.config import settings as app_settings
from app.core.limiter import limiter

app = FastAPI(
    title="Team Task Manager API",
    description=(
        "A REST API for managing projects, assigning tasks, and tracking progress "
        "with role-based access control (Admin/Member)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.get("/api/health/email", tags=["Health"])
def health_email():
    """Shows whether SMTP env vars are present (no secrets). Restart API after changing .env."""
    return {
        "smtp_env_configured": bool(
            (app_settings.MAIL_USERNAME or "").strip() and (app_settings.MAIL_PASSWORD or "").strip()
        ),
        "otp_email_plain_only": app_settings.OTP_EMAIL_PLAIN_ONLY,
        "dev_expose_otp_in_response": app_settings.DEV_EXPOSE_OTP_IN_RESPONSE,
        "mail_server": app_settings.MAIL_SERVER,
        "mail_port": app_settings.MAIL_PORT,
        "mail_use_ssl": app_settings.MAIL_USE_SSL,
        "mail_from": (app_settings.MAIL_FROM or app_settings.MAIL_USERNAME or "").strip() or None,
        "smtp_debug_enabled": bool(app_settings.MAIL_SMTP_DEBUG),
        "hints": [
            (
                "If scripts/test_smtp.py works but /docs signup does not, the API process loaded different MAIL_* "
                "than the script -- often empty OS env vars override .env, or uvicorn needs a restart from repo root."
            ),
            (
                "If POST /auth/signup returns email_sent true but mail never arrives: check Spam/Promotions; "
                "log into the MAIL_USERNAME Gmail Sent folder to confirm Gmail accepted outgoing mail."
            ),
            ("Set MAIL_SMTP_DEBUG=true in .env and restart uvicorn to print SMTP commands to the server console."),
        ],
    }


# Mount all API routes first
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")

# Serve the built React frontend (only if the build exists)
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        """Catch-all: serve index.html for client-side routes (not /api, not OpenAPI)."""
        # If no API route matched, never return the SPA for /api/* (avoids silent HTML "success" in dev)
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        index = FRONTEND_DIST / "index.html"
        return FileResponse(index)
