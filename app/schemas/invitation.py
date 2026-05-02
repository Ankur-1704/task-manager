from datetime import datetime

from pydantic import BaseModel

from app.schemas.auth import UserResponse


class InvitationDetailResponse(BaseModel):
    id: str
    email: str
    project_id: str
    project_name: str
    role: str
    invited_by: UserResponse
    expires_at: datetime
    is_accepted: bool

    model_config = {"from_attributes": True}
