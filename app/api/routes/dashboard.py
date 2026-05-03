from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.member import Member
from app.models.task import Task
from app.schemas.dashboard import DashboardResponse, TaskCounts
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(Member).filter(Member.user_id == current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    projects_count = len(project_ids)

    if not project_ids:
        return DashboardResponse(
            projects_count=0,
            task_counts=TaskCounts(todo=0, in_progress=0, done=0),
            overdue_tasks=[],
            recent_tasks=[],
        )

    all_tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all()

    todo_count = sum(1 for t in all_tasks if t.status == "TODO")
    in_progress_count = sum(1 for t in all_tasks if t.status == "IN_PROGRESS")
    done_count = sum(1 for t in all_tasks if t.status == "DONE")

    today = date.today()
    overdue_tasks = [
        t for t in all_tasks if t.due_date and t.due_date < today and t.status != "DONE"
    ]

    recent_tasks = (
        db.query(Task)
        .filter(Task.project_id.in_(project_ids), Task.assignee_id == current_user.id)
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardResponse(
        projects_count=projects_count,
        task_counts=TaskCounts(
            todo=todo_count,
            in_progress=in_progress_count,
            done=done_count,
        ),
        overdue_tasks=overdue_tasks,
        recent_tasks=recent_tasks,
    )
