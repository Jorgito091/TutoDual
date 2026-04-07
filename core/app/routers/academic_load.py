from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models.academic_load import AcademicLoad, AcademicLoadCreate, AcademicLoadRead, AcademicLoadUpdate
from app.models.users import User

router = APIRouter(prefix="/academic-load", tags=["academic-load"])


@router.post("/", response_model=AcademicLoadRead, status_code=status.HTTP_201_CREATED)
def create_academic_load(
    load_in: AcademicLoadCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value not in ("ADMINISTRADOR", "DOCENTE"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    load = AcademicLoad(**load_in.model_dump())
    session.add(load)
    session.commit()
    session.refresh(load)
    return load


@router.get("/", response_model=List[AcademicLoadRead])
def list_academic_loads(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "ALUMNO":
        return session.exec(
            select(AcademicLoad).where(AcademicLoad.student_id == current_user.id)
        ).all()
    return session.exec(select(AcademicLoad)).all()


@router.get("/student/{student_id}", response_model=List[AcademicLoadRead])
def get_student_loads(
    student_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return session.exec(
        select(AcademicLoad).where(AcademicLoad.student_id == student_id)
    ).all()


@router.get("/{load_id}", response_model=AcademicLoadRead)
def get_academic_load(
    load_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    load = session.get(AcademicLoad, load_id)
    if not load:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga académica no encontrada")
    return load


@router.patch("/{load_id}", response_model=AcademicLoadRead)
def update_academic_load(
    load_id: int,
    load_in: AcademicLoadUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update academic load - used by Dual service to sync final grade."""
    if current_user.role.value not in ("ADMINISTRADOR", "DOCENTE"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    load = session.get(AcademicLoad, load_id)
    if not load:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carga académica no encontrada")
    update_data = load_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(load, key, value)
    session.add(load)
    session.commit()
    session.refresh(load)
    return load
