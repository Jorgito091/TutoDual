from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.auth import TokenData, get_current_token_data
from app.database import get_session
from app.models.dual_projects import DualProject, DualProjectCreate, DualProjectRead, DualProjectUpdate
from app.services.core_client import verify_student_enrollment

router = APIRouter(prefix="/dual-projects", tags=["dual-projects"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://core:8000/auth/token")


@router.post("/", response_model=DualProjectRead, status_code=status.HTTP_201_CREATED)
async def create_dual_project(
    project_in: DualProjectCreate,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
    raw_token: str = Depends(oauth2_scheme),
):
    if token.role not in ("ADMINISTRADOR", "DOCENTE"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")

    # Verify with Core that the student has the subject enrolled
    enrolled = await verify_student_enrollment(
        student_id=project_in.student_id,
        materia=project_in.materia,
        periodo=project_in.periodo,
        bearer_token=raw_token,
    )
    if not enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El alumno no tiene inscrita la materia correspondiente en el Core",
        )

    project = DualProject(**project_in.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.get("/", response_model=List[DualProjectRead])
def list_dual_projects(
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    if token.role == "ALUMNO":
        return session.exec(
            select(DualProject).where(DualProject.student_id == token.user_id)
        ).all()
    return session.exec(select(DualProject)).all()


@router.get("/{project_id}", response_model=DualProjectRead)
def get_dual_project(
    project_id: int,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    project = session.get(DualProject, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto dual no encontrado")
    return project


@router.patch("/{project_id}", response_model=DualProjectRead)
def update_dual_project(
    project_id: int,
    project_in: DualProjectUpdate,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    project = session.get(DualProject, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto dual no encontrado")
    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project
