from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models.student_visibility import (
    StudentVisibility,
    StudentVisibilityCreate,
    StudentVisibilityRead,
    StudentVisibilityUpdate,
)
from app.models.users import User, UserRole

router = APIRouter(prefix="/student-visibility", tags=["student-visibility"])


@router.post("/", response_model=StudentVisibilityRead, status_code=status.HTTP_201_CREATED)
def create_visibility(
    vis_in: StudentVisibilityCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.ADMINISTRADOR, UserRole.ALUMNO):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    vis = StudentVisibility(**vis_in.model_dump())
    session.add(vis)
    session.commit()
    session.refresh(vis)
    return vis


@router.get("/student/{student_id}", response_model=List[StudentVisibilityRead])
def get_student_visibility(
    student_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return session.exec(
        select(StudentVisibility).where(StudentVisibility.student_id == student_id)
    ).all()


@router.patch("/{vis_id}", response_model=StudentVisibilityRead)
def update_visibility(
    vis_id: int,
    vis_in: StudentVisibilityUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    vis = session.get(StudentVisibility, vis_id)
    if not vis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    if current_user.role != UserRole.ADMINISTRADOR and current_user.id != vis.student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    update_data = vis_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vis, key, value)
    session.add(vis)
    session.commit()
    session.refresh(vis)
    return vis


@router.delete("/{vis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visibility(
    vis_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.ADMINISTRADOR, UserRole.ALUMNO):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    vis = session.get(StudentVisibility, vis_id)
    if not vis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    session.delete(vis)
    session.commit()
