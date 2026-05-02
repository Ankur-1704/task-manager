"""
Test **SMTP only** (Gmail or any MAIL_SERVER) — same stack as the API (`_send_via_smtp`).

By default this script calls ``_send_via_smtp`` with a simple test body. Use ``--otp-style``
to exercise ``send_otp_email`` (signup / “resend code” path).

Usage (from project root, venv activated):
  python scripts/test_smtp.py [--verbose] [--otp-style] you@example.com

  --verbose    Print SMTP wire log (set MAIL_SMTP_DEBUG=1 before loading config).
  --otp-style  Send using the same ``send_otp_email`` path as the API (not raw test body).

Requires a valid .env with MAIL_* variables. Does not print passwords.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Project root: parent of scripts/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if "--verbose" in sys.argv or "-v" in sys.argv:
    os.environ["MAIL_SMTP_DEBUG"] = "1"
    print(
        "WARNING: Verbose mode prints SMTP AUTH lines — do not share that log publicly.\n",
        file=sys.stderr,
    )

from app.core.config import settings  # noqa: E402
from app.core.email import _normalized_smtp_credentials, _send_via_smtp, send_otp_email  # noqa: E402


def main() -> None:
    otp_style = "--otp-style" in sys.argv
    args = [
        a
        for a in sys.argv[1:]
        if a not in ("--verbose", "-v", "--otp-style")
    ]
    to = (args[0] if args else "").strip()
    if not to or "@" not in to:
        print("Usage: python scripts/test_smtp.py [--verbose] <your-email@example.com>")
        sys.exit(1)

    user, pw = _normalized_smtp_credentials()
    if not user or not pw:
        print("MAIL_USERNAME and MAIL_PASSWORD must be set in .env")
        sys.exit(2)

    print(
        f"Using server={settings.MAIL_SERVER!r} port={settings.MAIL_PORT} "
        f"MAIL_USE_SSL={settings.MAIL_USE_SSL} login_user={user!r} "
        f"smtp_debug={settings.MAIL_SMTP_DEBUG}",
    )
    print(f"Sending TO (exact): {to!r}")
    print(f"In Gmail (recipient), search: from:{user}")
    if otp_style:
        print("Mode: --otp-style (same as API signup/resend OTP email).")
        ok = send_otp_email(to, "SMTP test", "123456")
    else:
        ok = _send_via_smtp(
            to,
            "Team Task Manager SMTP test",
            "<p>If you see this HTML, SMTP works.</p>",
            "If you see this plain text, SMTP works.",
            dev_otp_hint=None,
        )
    print("Result:", "OK — check inbox/spam." if ok else "FAILED — see ERROR logs above.")
    if ok:
        print(
            "\nIf you still see nothing:\n"
            "  • Spam, Promotions, Updates, and “All Mail” in the RECIPIENT account.\n"
            "  • Confirm you are logged into Gmail as the recipient address.\n"
            "  • On the SENDER account (login_user above), open Sent — copy should appear.\n",
        )
    sys.exit(0 if ok else 3)


if __name__ == "__main__":
    main()
