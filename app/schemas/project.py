from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)


class MemberResponse(BaseModel):
    id: str
    user: UserResponse
    role: Literal["ADMIN", "MEMBER"]
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    owner_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    members: list[MemberResponse] = Field(default_factory=list)


class AddMemberRequest(BaseModel):
    email: str = Field(..., description="Email of the user to add")
    role: Literal["ADMIN", "MEMBER"] = "MEMBER"
