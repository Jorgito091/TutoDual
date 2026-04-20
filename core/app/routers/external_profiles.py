from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models.external_profiles import (
    ExternalProfile,
    ExternalProfileCreate,
    ExternalProfileRead,
    ExternalProfileUpdate,
)
from app.models.users import User, UserRole

router = APIRouter(prefix="/external-profiles", tags=["external-profiles"])


@router.post("/", response_model=ExternalProfileRead, status_code=status.HTTP_201_CREATED)
def create_external_profile(
    profile_in: ExternalProfileCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    user = session.get(User, profile_in.user_id)
    if not user or user.role != UserRole.EXTERNO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El perfil externo solo aplica a usuarios con rol EXTERNO",
        )
    existing = session.exec(
        select(ExternalProfile).where(ExternalProfile.user_id == profile_in.user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un perfil para este usuario")
    profile = ExternalProfile(**profile_in.model_dump())
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=ExternalProfileRead)
def get_external_profile(
    profile_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    profile = session.get(ExternalProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return profile


@router.get("/user/{user_id}", response_model=ExternalProfileRead)
def get_profile_by_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    profile = session.exec(
        select(ExternalProfile).where(ExternalProfile.user_id == user_id)
    ).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return profile


@router.patch("/{profile_id}", response_model=ExternalProfileRead)
def update_external_profile(
    profile_id: int,
    profile_in: ExternalProfileUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    profile = session.get(ExternalProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    if current_user.role != UserRole.ADMINISTRADOR and current_user.id != profile.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
