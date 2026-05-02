from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = Field(None, max_length=5000)
    status: Literal["TODO", "IN_PROGRESS", "DONE"] = "TODO"
    priority: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    due_date: date | None = None
    assignee_id: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    status: Literal["TODO", "IN_PROGRESS", "DONE"] | None = None
    priority: Literal["LOW", "MEDIUM", "HIGH"] | None = None
    due_date: date | None = None
    assignee_id: str | None = None


class TaskStatusUpdate(BaseModel):
    status: Literal["TODO", "IN_PROGRESS", "DONE"]


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: Literal["TODO", "IN_PROGRESS", "DONE"]
    priority: Literal["LOW", "MEDIUM", "HIGH"]
    due_date: date | None
    project_id: str
    assignee_id: str | None
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    assignee: UserResponse | None = None
    created_by: UserResponse | None = None

    model_config = {"from_attributes": True}
