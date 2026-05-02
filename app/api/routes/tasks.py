from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user, get_db, get_project_member, require_admin
from app.models.member import Member
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks"])


@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    project_id: str,
    status_filter: str | None = Query(None, alias="status"),
    assignee_id: str | None = Query(None),
    overdue: bool = Query(False),
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.project_id == project_id)

    if status_filter:
        if status_filter not in ("TODO", "IN_PROGRESS", "DONE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="status must be TODO, IN_PROGRESS, or DONE",
            )
        query = query.filter(Task.status == status_filter)

    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)

    if overdue:
        today = date.today()
        query = query.filter(Task.due_date < today, Task.status != "DONE")

    return query.order_by(Task.created_at.desc()).all()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: str,
    payload: TaskCreate,
    current_user: User = Depends(get_current_verified_user),
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    if payload.assignee_id:
        assignee_member = (
            db.query(Member)
            .filter(Member.project_id == project_id, Member.user_id == payload.assignee_id)
            .first()
        )
        if not assignee_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee must be a member of this project",
            )

    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
        project_id=project_id,
        assignee_id=payload.assignee_id,
        created_by_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    project_id: str,
    task_id: str,
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    project_id: str,
    task_id: str,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_verified_user),
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if member.role != "ADMIN" and task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Members can only update tasks assigned to them",
        )

    if payload.assignee_id is not None:
        if payload.assignee_id != "":
            assignee_member = (
                db.query(Member)
                .filter(
                    Member.project_id == project_id, Member.user_id == payload.assignee_id
                )
                .first()
            )
            if not assignee_member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignee must be a member of this project",
                )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    project_id: str,
    task_id: str,
    payload: TaskStatusUpdate,
    current_user: User = Depends(get_current_verified_user),
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if member.role != "ADMIN" and task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Members can only update status of tasks assigned to them",
        )

    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    project_id: str,
    task_id: str,
    admin: Member = Depends(require_admin),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
