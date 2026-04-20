from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.auth import TokenData, get_current_token_data
from app.database import get_session
from app.models.dual_projects import DualProject
from app.models.evaluations import Evaluation7030, Evaluation7030Create, Evaluation7030Read, Evaluation7030Update
from app.services.core_client import sync_grade_to_core

router = APIRouter(prefix="/evaluations", tags=["evaluations"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://core:8000/auth/token")


def _calculate_final_grade(nota_empresa: float, nota_docente: float) -> float:
    """Calculate final grade: 70% empresa + 30% docente."""
    return round(nota_empresa * 0.7 + nota_docente * 0.3, 2)


@router.post("/", response_model=Evaluation7030Read, status_code=status.HTTP_201_CREATED)
def create_evaluation(
    eval_in: Evaluation7030Create,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    if token.role not in ("ADMINISTRADOR", "DOCENTE", "EXTERNO"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")

    project = session.get(DualProject, eval_in.dual_project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto dual no encontrado")

    evaluation = Evaluation7030(**eval_in.model_dump())
    if evaluation.nota_empresa is not None and evaluation.nota_docente is not None:
        evaluation.final_grade_calculated = _calculate_final_grade(
            evaluation.nota_empresa, evaluation.nota_docente
        )
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)
    return evaluation


@router.get("/", response_model=List[Evaluation7030Read])
def list_evaluations(
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    if token.role == "ALUMNO":
        return session.exec(
            select(Evaluation7030).where(Evaluation7030.student_id == token.user_id)
        ).all()
    return session.exec(select(Evaluation7030)).all()


@router.get("/{eval_id}", response_model=Evaluation7030Read)
def get_evaluation(
    eval_id: int,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    evaluation = session.get(Evaluation7030, eval_id)
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluación no encontrada")
    return evaluation


@router.patch("/{eval_id}", response_model=Evaluation7030Read)
async def update_evaluation(
    eval_id: int,
    eval_in: Evaluation7030Update,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
    raw_token: str = Depends(oauth2_scheme),
):
    """Update evaluation grades and recalculate final grade.
    When both grades are present, syncs to Core academic_load.
    """
    if token.role not in ("ADMINISTRADOR", "DOCENTE", "EXTERNO"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")

    evaluation = session.get(Evaluation7030, eval_id)
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluación no encontrada")

    update_data = eval_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(evaluation, key, value)

    # Recalculate final grade if both notes are present
    if evaluation.nota_empresa is not None and evaluation.nota_docente is not None:
        evaluation.final_grade_calculated = _calculate_final_grade(
            evaluation.nota_empresa, evaluation.nota_docente
        )

    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)

    # Sync to Core if final grade is complete and not yet synced
    if (
        evaluation.final_grade_calculated is not None
        and not evaluation.sincronizado_core
    ):
        project = session.get(DualProject, evaluation.dual_project_id)
        if project and project.academic_load_id:
            synced = await sync_grade_to_core(
                academic_load_id=project.academic_load_id,
                final_grade=float(evaluation.final_grade_calculated),
                bearer_token=raw_token,
            )
            if synced:
                evaluation.sincronizado_core = True
                session.add(evaluation)
                session.commit()
                session.refresh(evaluation)

    return evaluation


@router.post("/{eval_id}/sync-core", response_model=Evaluation7030Read)
async def force_sync_to_core(
    eval_id: int,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
    raw_token: str = Depends(oauth2_scheme),
):
    """Force synchronization of the final grade to Core's academic_load."""
    if token.role not in ("ADMINISTRADOR", "DOCENTE"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")

    evaluation = session.get(Evaluation7030, eval_id)
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluación no encontrada")
    if evaluation.final_grade_calculated is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La calificación final aún no ha sido calculada (faltan notas)",
        )

    project = session.get(DualProject, evaluation.dual_project_id)
    if not project or not project.academic_load_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El proyecto dual no tiene academic_load_id configurado",
        )

    synced = await sync_grade_to_core(
        academic_load_id=project.academic_load_id,
        final_grade=float(evaluation.final_grade_calculated),
        bearer_token=raw_token,
    )
    if not synced:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Error al sincronizar con el Core")

    evaluation.sincronizado_core = True
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)
    return evaluation
