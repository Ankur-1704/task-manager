import html as html_module
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _normalized_smtp_credentials() -> tuple[str, str]:
    """Strip .env junk (CRLF, accidental quotes) and Gmail app-password spaces."""
    user = (settings.MAIL_USERNAME or "").strip().strip('"').strip("'")
    pw = (settings.MAIL_PASSWORD or "").strip().strip('"').strip("'")
    pw = pw.replace("\r", "").replace("\n", "")
    if "gmail.com" in (settings.MAIL_SERVER or "").lower():
        pw = pw.replace(" ", "")
    return user, pw


def _send_via_smtp(
    to_email: str,
    subject: str,
    html_body: str,
    plain: str,
    *,
    dev_otp_hint: str | None,
    plain_only: bool = False,
) -> bool:
    mail_user, mail_pass = _normalized_smtp_credentials()
    if not mail_user or not mail_pass:
        logger.warning(
            "[EMAIL] SMTP not set (MAIL_USERNAME / MAIL_PASSWORD). No email was sent. "
            "Set both in .env and restart the API server."
        )
        if dev_otp_hint:
            logger.warning("[EMAIL] Dev fallback - use this code to verify: %s", dev_otp_hint)
        else:
            logger.warning("[EMAIL] Would send to %r subject=%r", to_email, subject)
            logger.warning("[EMAIL] Body preview:\n%s", html_body[:500])
        return False

    from_addr = (settings.MAIL_FROM or mail_user).strip()
    if not from_addr:
        logger.error("[EMAIL] MAIL_FROM and MAIL_USERNAME are empty; cannot send.")
        return False

    try:
        msg: MIMEMultipart | MIMEText
        if plain_only:
            msg = MIMEText(plain, "plain", "utf-8")
        else:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(plain, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to_email

        context = ssl.create_default_context()
        use_ssl_flag = settings.MAIL_USE_SSL

        if use_ssl_flag:
            with smtplib.SMTP_SSL(
                settings.MAIL_SERVER,
                settings.MAIL_PORT,
                timeout=45,
                context=context,
            ) as server:
                if settings.MAIL_SMTP_DEBUG:
                    server.set_debuglevel(1)
                server.login(mail_user, mail_pass)
                refused = server.sendmail(from_addr, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(
                settings.MAIL_SERVER,
                settings.MAIL_PORT,
                timeout=45,
            ) as server:
                if settings.MAIL_SMTP_DEBUG:
                    server.set_debuglevel(1)
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(mail_user, mail_pass)
                refused = server.sendmail(from_addr, [to_email], msg.as_string())

        if refused:
            logger.error("[EMAIL] SMTP accepted session but refused recipients: %s", refused)
            return False

        logger.info("[EMAIL] SMTP sent to %r: %r", to_email, subject)
        return True
    except Exception as exc:
        hint = ""
        if not settings.MAIL_USE_SSL and settings.MAIL_PORT == 587:
            hint = (
                " If this persists, try MAIL_USE_SSL=true and MAIL_PORT=465 "
                "(some networks block STARTTLS on 587)."
            )
        logger.error(
            "[EMAIL] Failed to send to %r via %s:%s (SSL=%s): %s.%s",
            to_email,
            settings.MAIL_SERVER,
            settings.MAIL_PORT,
            settings.MAIL_USE_SSL,
            exc,
            hint,
        )
        return False


def _send(
    to_email: str,
    subject: str,
    html_body: str,
    plain_body: str | None = None,
    *,
    dev_otp_hint: str | None = None,
    plain_only: bool = False,
) -> bool:
    """Send mail over SMTP (same as ``scripts/test_smtp.py`` when using multipart).

    ``plain_only``: single text/plain part; otherwise multipart plain + html.
    """
    plain = plain_body if plain_body is not None else (
        "Open this email in an HTML-capable client to view your message."
    )

    return _send_via_smtp(
        to_email,
        subject,
        html_body,
        plain,
        dev_otp_hint=dev_otp_hint,
        plain_only=plain_only,
    )


def send_otp_email(to_email: str, name: str, otp_code: str) -> bool:
    subject = "Your Team Task Manager verification code"
    plain = (
        f"Hi {name},\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"It expires in 10 minutes.\n\n"
        f"If you didn't create an account, ignore this email.\n"
    )
    html_light = (
        "<p style=\"font-family:system-ui,sans-serif;line-height:1.5\">"
        + html_module.escape(plain).replace("\n", "<br/>")
        + "</p>"
    )
    mail_u, mail_p = _normalized_smtp_credentials()
    smtp_creds = bool(mail_u and mail_p)
    logger.info(
        "[EMAIL] OTP send start to=%r smtp_creds=%s plain_only=%s",
        to_email,
        smtp_creds,
        settings.OTP_EMAIL_PLAIN_ONLY,
    )
    if not smtp_creds:
        logger.warning(
            "[EMAIL] MAIL_USERNAME/PASSWORD missing - cannot send OTP. "
            "Set MAIL_* in .env and restart (see GET /api/health/email).",
        )

    ok = _send(
        to_email,
        subject,
        html_light,
        plain_body=plain,
        dev_otp_hint=otp_code,
        plain_only=settings.OTP_EMAIL_PLAIN_ONLY,
    )
    if ok:
        logger.info(
            "[EMAIL] OTP mail handed off for %r - if you see nothing: Spam, Promotions, All Mail; "
            "confirm the signup email matches this inbox; on the sender Gmail account open Sent.",
            to_email,
        )
    else:
        logger.warning(
            "[EMAIL] OTP mail NOT sent for %r - check API logs above; use /resume-verification "
            "or run: python scripts/test_smtp.py",
            to_email,
        )
        if settings.LOG_OTP_ON_SMTP_FAIL:
            logger.error(
                "[EMAIL] LOG_OTP_ON_SMTP_FAIL=1 — OTP for %r: %s (disable this in production)",
                to_email,
                otp_code,
            )
    return ok


def send_invitation_email(
    to_email: str,
    project_name: str,
    inviter_name: str,
    role: str,
    invitation_link: str,
    user_exists: bool,
) -> bool:
    subject = f"You've been invited to join '{project_name}' on Team Task Manager"
    action = "Accept Invitation" if user_exists else "Create Account & Join"
    intro_plain = (
        f"You have been invited to join {project_name} as a {role}."
        if user_exists
        else (
            f"{inviter_name} has invited you to join {project_name} as a {role}. "
            "Create your free account to get started."
        )
    )
    intro_html = (
        f"You have been invited to join <strong>{project_name}</strong> as a <strong>{role}</strong>."
        if user_exists
        else (
            f"<strong>{inviter_name}</strong> has invited you to join <strong>{project_name}</strong> "
            f"as a <strong>{role}</strong>. Create your free account to get started."
        )
    )
    plain = f"{intro_plain}\n\nOpen: {invitation_link}\n\nThis invitation expires in 7 days."
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:40px 0;">
          <table width="480" style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <tr><td>
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:12px;padding:12px 20px;">
                  <span style="color:#fff;font-size:22px;font-weight:700;">&#10003; Team Task Manager</span>
                </div>
              </div>
              <h2 style="color:#1f2937;margin:0 0 8px;">You're invited!</h2>
              <p style="color:#6b7280;margin:0 0 24px;">{intro_html}</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="{invitation_link}"
                   style="background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                  {action}
                </a>
              </div>
              <p style="color:#9ca3af;font-size:13px;text-align:center;">
                This invitation expires in 7 days. Invited by <strong>{inviter_name}</strong>.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    return _send(to_email, subject, html, plain_body=plain)
