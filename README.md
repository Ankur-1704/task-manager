# Team Task Manager API

A production-ready REST API built with **Python + FastAPI** for managing projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

**Live interactive docs available at `/docs` (Swagger UI) once deployed.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Deployment | Railway |

---

## Project Structure

```
team-task-manager/
├── alembic/               # DB migrations
│   ├── versions/
│   └── env.py
├── app/
│   ├── api/
│   │   ├── deps.py        # Shared dependencies (auth, RBAC)
│   │   └── routes/        # auth, projects, tasks, dashboard
│   ├── core/
│   │   ├── config.py      # Settings from .env
│   │   └── security.py    # JWT + password hashing
│   ├── db/
│   │   ├── base.py        # SQLAlchemy base + model imports
│   │   └── session.py     # Engine + SessionLocal
│   ├── models/            # ORM models
│   ├── schemas/           # Pydantic request/response schemas
│   └── main.py            # App entry point
├── requirements.txt
├── railway.toml
├── Procfile
└── .env.example
```

---

## Local Development Setup

### 1. Clone and install dependencies

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
# Edit .env with your PostgreSQL credentials and a strong SECRET_KEY
```

### 3. Run database migrations

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### 4. Start the server

```bash
uvicorn app.main:app --reload
```

The API will be live at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT signing secret (keep private) | `your-random-32-char-secret` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` |

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require:
```
Authorization: Bearer <token>
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT token |
| GET | `/api/auth/me` | Yes | Get current user profile |

**Signup request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Login request body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Token response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

---

### Projects — `/api/projects`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/projects` | Yes | Any member | List all projects user belongs to |
| POST | `/api/projects` | Yes | Authenticated | Create new project (creator becomes ADMIN) |
| GET | `/api/projects/{id}` | Yes | Any member | Get project details + members |
| PUT | `/api/projects/{id}` | Yes | ADMIN | Update project name/description |
| DELETE | `/api/projects/{id}` | Yes | ADMIN | Delete project |
| GET | `/api/projects/{id}/members` | Yes | Any member | List project members |
| POST | `/api/projects/{id}/members` | Yes | ADMIN | Add member by email |
| DELETE | `/api/projects/{id}/members/{userId}` | Yes | ADMIN | Remove member |

**Create project body:**
```json
{
  "name": "Website Redesign",
  "description": "Q2 2026 redesign project"
}
```

**Add member body:**
```json
{
  "email": "bob@example.com",
  "role": "MEMBER"
}
```

---

### Tasks — `/api/projects/{project_id}/tasks`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/projects/{id}/tasks` | Yes | Any member | List tasks (filterable) |
| POST | `/api/projects/{id}/tasks` | Yes | Any member | Create a task |
| GET | `/api/projects/{id}/tasks/{taskId}` | Yes | Any member | Get task detail |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Yes | ADMIN or assignee | Update task |
| PATCH | `/api/projects/{id}/tasks/{taskId}/status` | Yes | ADMIN or assignee | Update status only |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Yes | ADMIN | Delete task |

**Query parameters for GET /tasks:**
- `?status=TODO` — filter by status (TODO, IN_PROGRESS, DONE)
- `?assignee_id=<uuid>` — filter by assignee
- `?overdue=true` — show only overdue tasks

**Create task body:**
```json
{
  "title": "Design new landing page",
  "description": "Figma mockup first, then implement",
  "status": "TODO",
  "priority": "HIGH",
  "due_date": "2026-05-15",
  "assignee_id": "<user-uuid>"
}
```

**Status values:** `TODO` | `IN_PROGRESS` | `DONE`  
**Priority values:** `LOW` | `MEDIUM` | `HIGH`

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Summary of user's projects and tasks |

**Response:**
```json
{
  "projects_count": 3,
  "task_counts": {
    "todo": 8,
    "in_progress": 4,
    "done": 12
  },
  "overdue_tasks": [...],
  "recent_tasks": [...]
}
```

---

## Role-Based Access Control

| Action | ADMIN | MEMBER |
|---|---|---|
| View project & tasks | Yes | Yes |
| Create tasks | Yes | Yes |
| Update own assigned task | Yes | Yes |
| Update any task | Yes | No |
| Delete tasks | Yes | No |
| Manage members (add/remove) | Yes | No |
| Update/delete project | Yes | No |

---

## Deploy to Railway

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### Step 2: Create Railway project
1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### Step 3: Add PostgreSQL
1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL` in your service environment

### Step 4: Set environment variables
In your service settings → **Variables**, add:
```
SECRET_KEY=<generate a random 32+ character string>
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 5: Deploy
Railway will automatically:
1. Detect Python via Nixpacks
2. Run `pip install -r requirements.txt && alembic upgrade head`
3. Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Your API will be live at `https://<your-app>.railway.app`  
Swagger docs at `https://<your-app>.railway.app/docs`

---

## Generating SECRET_KEY

```python
import secrets
print(secrets.token_hex(32))
```
