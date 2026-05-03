from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.project import Project
from app.models.user import User
from app.schemas.invitation import InvitationDetailResponse

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.get("/{token}", response_model=InvitationDetailResponse)
def get_invitation(token: str, db: Session = Depends(get_db)):
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if invitation.is_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has already been accepted"
        )
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired"
        )
    project = db.query(Project).filter(Project.id == invitation.project_id).first()
    return InvitationDetailResponse(
        id=invitation.id,
        email=invitation.email,
        project_id=invitation.project_id,
        project_name=project.name if project else "Unknown Project",
        role=invitation.role,
        invited_by=invitation.invited_by,
        expires_at=invitation.expires_at,
        is_accepted=invitation.is_accepted,
    )


@router.post("/{token}/accept", status_code=status.HTTP_200_OK)
def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = (
        db.query(Invitation)
        .filter(
            Invitation.token == token,
            Invitation.is_accepted == False,  # noqa: E712
            Invitation.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or already accepted",
        )
    if invitation.email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation was sent to a different email address",
        )
    existing = (
        db.query(Member)
        .filter(
            Member.project_id == invitation.project_id, Member.user_id == current_user.id
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this project",
        )
    db.add(Member(project_id=invitation.project_id, user_id=current_user.id, role=invitation.role))
    invitation.is_accepted = True
    db.commit()
    return {"message": f"Successfully joined the project as {invitation.role}"}
