from pydantic import BaseModel

from app.schemas.task import TaskResponse


class TaskCounts(BaseModel):
    todo: int
    in_progress: int
    done: int


class DashboardResponse(BaseModel):
    projects_count: int
    task_counts: TaskCounts
    overdue_tasks: list[TaskResponse]
    recent_tasks: list[TaskResponse]
