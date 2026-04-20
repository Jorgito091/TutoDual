import enum
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class ProjectStatus(str, enum.Enum):
    ACTIVO = "ACTIVO"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"


class DualProjectBase(SQLModel):
    # FK lógicas al Core (IDs de usuarios gestionados por Core)
    student_id: int = Field(nullable=False, description="ID del alumno en el Core")
    asesor_academico_id: int = Field(nullable=False, description="ID del docente asesor en el Core")
    mentor_empresarial_id: int = Field(nullable=False, description="ID del mentor (EXTERNO) en el Core")
    company_id: int = Field(foreign_key="companies.id", nullable=False)
    materia: str = Field(nullable=False, description="Materia correspondiente en el Core")
    periodo: str = Field(nullable=False)
    status: ProjectStatus = Field(
        default=ProjectStatus.ACTIVO,
        sa_column=Column(sa.Enum(ProjectStatus), nullable=False),
    )
    descripcion: Optional[str] = Field(default=None)
    # ID de la carga académica en el Core para sincronización
    academic_load_id: Optional[int] = Field(default=None, description="ID en academic_load del Core")


class DualProject(DualProjectBase, table=True):
    __tablename__ = "dual_projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(sa.DateTime, server_default=sa.func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            sa.DateTime,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )


class DualProjectCreate(DualProjectBase):
    pass


class DualProjectRead(DualProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime


class DualProjectUpdate(SQLModel):
    status: Optional[ProjectStatus] = None
    descripcion: Optional[str] = None
    academic_load_id: Optional[int] = None
