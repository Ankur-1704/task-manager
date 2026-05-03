# Team Task Manager

Full-stack app for team projects and tasks: **FastAPI** (REST API + static hosting of the production build) and **React** (Vite, TypeScript, Tailwind). Role-based access for **Admin** and **Member**.

- **Production:** one URL serves the SPA and `/api/*` (see `app/main.py`).
- **Interactive API docs:** `/docs` and `/redoc` when the server is running.

---

## Features

- **Auth:** Sign up and log in with email and password. New accounts are **active immediately** (no email OTP or SMTP required).
- **Projects & members:** Create projects; invite by email. If the person has no account yet, the API returns a **`signup_link`** to copy and share (the app does not send invitation email).
- **Tasks:** Kanban-friendly statuses, assignees, priorities, due dates, filters.
- **Dashboard:** Overview of counts, overdue tasks, recent activity.
- **Optional SMTP:** `MAIL_*` variables are only needed if you use `scripts/test_smtp.py` or extend the code to send mail. **Railway Hobby/free tiers often block outbound SMTP**; use an HTTPS email API (e.g. Resend) if you add email later.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| API | FastAPI, Pydantic v2 |
| Database | PostgreSQL |
| ORM & migrations | SQLAlchemy 2.x, Alembic |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Rate limiting | slowapi |
| Frontend | React 18, Vite 5, TypeScript, TanStack Query, Tailwind, react-router-dom |
| Server | Uvicorn |
| Deploy | Railway (Nixpacks) |

---

## Repository layout

```
team-task-manager/
├── alembic/                  # DB migrations
│   ├── versions/
│   └── env.py
├── app/
│   ├── api/
│   │   ├── deps.py           # Auth + DB session + project membership
│   │   └── routes/         # auth, projects, tasks, dashboard, invitations
│   ├── core/
│   │   ├── config.py        # Settings (env / .env)
│   │   ├── security.py      # JWT + passwords
│   │   ├── email.py         # SMTP helpers (optional; not used for signup)
│   │   └── limiter.py
│   ├── db/
│   ├── models/
│   ├── schemas/
│   └── main.py              # App entry + static SPA when frontend/dist exists
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   └── vite.config.ts       # Dev proxy /api → FastAPI
├── scripts/
│   └── test_smtp.py         # Optional SMTP test
├── requirements.txt
├── railway.toml             # Build + start commands for Railway
├── nixpacks.toml            # Node + Python toolchain on Railway
├── Procfile
├── .env.example
└── README.md
```

---

## Local development

### 1. Clone and Python environment

```bash
git clone <your-repo-url>
cd team-task-manager
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`: set **`DATABASE_URL`**, **`SECRET_KEY`**, and optionally **`FRONTEND_URL`** (for invitation links; use `http://localhost:5173` when using the Vite dev server).

### 3. Database migrations

The repo already contains migrations. Apply them:

```bash
alembic upgrade head
```

Only create new revisions when you change models:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### 4. Run the API

From the **repository root**:

```bash
uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

Without a built frontend under `frontend/dist`, the API still runs; the SPA is normally developed separately (below).

### 5. Run the frontend (development)

Uses Vite’s proxy so browser calls `/api` go to the backend.

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173` (proxies `/api` → `http://127.0.0.1:8000` unless `VITE_API_PROXY` overrides).

### 6. Optional: production-like local build

```bash
cd frontend && npm run build && cd ..
uvicorn app.main:app --reload
```

Then open `http://127.0.0.1:8000` — the same process serves the built SPA and the API.

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL URL, e.g. `postgresql://user:pass@host:5432/db?sslmode=require` |
| `SECRET_KEY` | Yes | Strong secret for signing JWTs (never commit real values) |
| `ALGORITHM` | No | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default `30` |
| `FRONTEND_URL` | Recommended | Public browser URL (invitation links use this). Example: `https://your-app.up.railway.app` or `http://localhost:5173` in dev |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` | No | Connection pool tuning |

**Optional (SMTP — not used for signup in current app):**

| Variable | Description |
| --- | --- |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_SSL` | Gmail or other SMTP; see `.env.example` |
| `MAIL_SMTP_DEBUG` | Verbose SMTP logging (debug only) |
| `OTP_EMAIL_PLAIN_ONLY` | Affects `send_otp_email` in `scripts/test_smtp.py` only |

---

## Deploy on Railway

### Prerequisites

- Repo on GitHub (or Git provider Railway supports).
- **PostgreSQL:** Railway plugin or external DB (e.g. Neon). Expose **`DATABASE_URL`** to the **web** service.

### What the repo configures

- **`railway.toml`** — Build: install/build **frontend**, then `python3 -m pip install` and **`alembic upgrade head`**. Start: **`python3 -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`**.
- **`nixpacks.toml`** — Adds **Node.js** next to **Python** so `npm run build` works (Python-only Nixpacks images would not include `npm`).

### Steps

1. **New project** → Deploy from your Git repository.
2. Add **PostgreSQL** (or set `DATABASE_URL` from Neon, etc.) and **reference** it on the **same service** that runs the app.
3. **Variables** on the web service (no quotes around values unless you want literal quote characters):

   - `DATABASE_URL` — from Postgres or Neon  
   - `SECRET_KEY` — e.g. `python -c "import secrets; print(secrets.token_hex(32))"`  
   - `FRONTEND_URL` — your **public** Railway HTTPS URL (for invitation links)  
   - `ACCESS_TOKEN_EXPIRE_MINUTES` — optional  

4. **Generate a public domain** for the service (Railway **Networking**).
5. Redeploy. Health check: **`GET /health`**.

**SMTP on Railway:** Many **non-Pro** plans **block outbound SMTP** (symptom: `Network is unreachable` to `smtp.gmail.com`). This app **does not require SMTP** for registration. For real email later, prefer an **HTTPS** provider (Resend, SendGrid, etc.) or a plan that allows SMTP.

---

## API overview

All JSON API routes are under **`/api`**. Protected routes need:

```http
Authorization: Bearer <access_token>
```

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | Liveness |
| GET | `/api/health/email` | No | Whether `MAIL_*` looks configured (diagnostics; no secrets returned) |

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | No | Register; user is verified immediately. Optional `invitation_token` in body. |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |

**Signup body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "invitation_token": "optional-uuid-from-invite-link"
}
```

**Token response (simplified):**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "is_verified": true,
  "dev_otp": null,
  "email_sent": null
}
```

`dev_otp` / `email_sent` are kept for backward compatibility; they are unused for the default signup flow.

### Projects — `/api/projects`

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/api/projects/` | Member | List projects |
| POST | `/api/projects/` | Any user | Create project (creator = ADMIN) |
| GET | `/api/projects/{id}` | Member | Project + members |
| PUT | `/api/projects/{id}` | ADMIN | Update |
| DELETE | `/api/projects/{id}` | ADMIN | Delete |
| GET | `/api/projects/{id}/members` | Member | List members |
| POST | `/api/projects/{id}/members` | ADMIN | Add by email |
| DELETE | `/api/projects/{id}/members/{user_id}` | ADMIN | Remove member |

**Add member**

- If the email **already has an account:** user is added to the project; response includes `"type": "added"`.
- If **no account:** an invitation row is created; response includes **`"type": "invited"`** and **`"signup_link"`** (full URL with `invitation_token`). **Share that link manually** (email is not sent by the server).

### Invitations — `/api/invitations`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/invitations/{token}` | No | Invitation metadata (for signup flow) |
| POST | `/api/invitations/{token}/accept` | Yes | Accept after signup/login (email must match invitation) |

### Tasks — `/api/projects/{project_id}/tasks`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/projects/{id}/tasks/` | List (filters: `status`, `assignee_id`, `overdue`) |
| POST | `/api/projects/{id}/tasks/` | Create |
| GET | `/api/projects/{id}/tasks/{task_id}` | Detail |
| PUT | `/api/projects/{id}/tasks/{task_id}` | Update |
| PATCH | `/api/projects/{id}/tasks/{task_id}/status` | Status only |
| DELETE | `/api/projects/{id}/tasks/{task_id}` | ADMIN only |

**Statuses:** `TODO`, `IN_PROGRESS`, `DONE`  
**Priorities:** `LOW`, `MEDIUM`, `HIGH`

### Dashboard — `/api/dashboard`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/` | Counts, overdue tasks, recent tasks |

---

## Role-based access

| Action | ADMIN | MEMBER |
| --- | --- | --- |
| View project & tasks | Yes | Yes |
| Create tasks | Yes | Yes |
| Update own task | Yes | Yes |
| Update any task | Yes | No |
| Delete tasks | Yes | No |
| Add/remove members | Yes | No |
| Edit/delete project | Yes | No |

---

## Generating `SECRET_KEY`

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Use the output as `SECRET_KEY` in `.env` or your host’s environment UI.

---

## License / contributing

Use and change this project per your team’s policy. For production hardening, review secrets, CORS, rate limits, and database backups.
