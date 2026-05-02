import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user, get_db, get_project_member, require_admin
from app.core.config import settings
from app.core.email import send_invitation_email
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.project import Project
from app.models.user import User
from app.schemas.project import (
    AddMemberRequest,
    MemberResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(Member).filter(Member.user_id == current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    return projects


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.flush()

    admin_member = Member(
        project_id=project.id,
        user_id=current_user.id,
        role="ADMIN",
    )
    db.add(admin_member)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    admin: Member = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    admin: Member = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    db.delete(project)
    db.commit()


@router.get("/{project_id}/members", response_model=list[MemberResponse])
def list_members(
    project_id: str,
    member: Member = Depends(get_project_member),
    db: Session = Depends(get_db),
):
    members = db.query(Member).filter(Member.project_id == project_id).all()
    return members


@router.post(
    "/{project_id}/members",
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    project_id: str,
    payload: AddMemberRequest,
    background_tasks: BackgroundTasks,
    admin: Member = Depends(require_admin),
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    user = db.query(User).filter(User.email == payload.email).first()

    if user:
        existing = (
            db.query(Member)
            .filter(Member.project_id == project_id, Member.user_id == user.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this project",
            )
        new_member = Member(project_id=project_id, user_id=user.id, role=payload.role)
        db.add(new_member)
        db.commit()
        db.refresh(new_member)

        invitation_link = f"{settings.FRONTEND_URL}/projects/{project_id}"
        background_tasks.add_task(
            send_invitation_email,
            user.email,
            project.name,
            current_user.name,
            payload.role,
            invitation_link,
            True,
        )
        return {"message": f"User added to project as {payload.role}", "type": "added"}

    # User doesn't exist — create invitation and send signup link
    pending = (
        db.query(Invitation)
        .filter(
            Invitation.project_id == project_id,
            Invitation.email == payload.email,
            Invitation.is_accepted == False,  # noqa: E712
            Invitation.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation has already been sent to this email",
        )

    token = str(uuid.uuid4())
    invitation = Invitation(
        email=payload.email,
        project_id=project_id,
        role=payload.role,
        token=token,
        invited_by_id=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()

    invitation_link = f"{settings.FRONTEND_URL}/signup?invitation_token={token}"
    background_tasks.add_task(
        send_invitation_email,
        payload.email,
        project.name,
        current_user.name,
        payload.role,
        invitation_link,
        False,
    )
    return {
        "message": f"Invitation sent to {payload.email}. They will receive an email to create an account.",
        "type": "invited",
    }


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: str,
    user_id: str,
    admin: Member = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the project owner",
        )
    member = (
        db.query(Member)
        .filter(Member.project_id == project_id, Member.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this project",
        )
    db.delete(member)
    db.commit()
