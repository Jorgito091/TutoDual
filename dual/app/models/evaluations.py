from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class Evaluation7030Base(SQLModel):
    dual_project_id: int = Field(foreign_key="dual_projects.id", nullable=False)
    # FK lógicas al Core
    student_id: int = Field(nullable=False, description="ID del alumno en el Core")
    nota_empresa: Optional[float] = Field(default=None, ge=0, le=10, description="Calificación 70% (empresa)")
    nota_docente: Optional[float] = Field(default=None, ge=0, le=10, description="Calificación 30% (docente)")
    observaciones_empresa: Optional[str] = Field(default=None)
    observaciones_docente: Optional[str] = Field(default=None)
    sincronizado_core: bool = Field(default=False, description="Si la nota final fue enviada al Core")


class Evaluation7030(Evaluation7030Base, table=True):
    __tablename__ = "evaluations_70_30"

    id: Optional[int] = Field(default=None, primary_key=True)
    # Columna calculada: 70% empresa + 30% docente
    # NOTA: PostgreSQL GENERATED ALWAYS AS se aplica mediante DDL en la migración/trigger
    # Se calcula en Python como columna de solo lectura
    final_grade_calculated: Optional[float] = Field(
        default=None,
        sa_column=Column(sa.Numeric(5, 2), nullable=True),
        description="Calificación final calculada (70% empresa + 30% docente)",
    )
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

    __table_args__ = (
        sa.UniqueConstraint("dual_project_id", name="uq_eval_per_project"),
    )


class Evaluation7030Create(Evaluation7030Base):
    pass


class Evaluation7030Read(Evaluation7030Base):
    id: int
    final_grade_calculated: Optional[float]
    created_at: datetime
    updated_at: datetime


class Evaluation7030Update(SQLModel):
    nota_empresa: Optional[float] = None
    nota_docente: Optional[float] = None
    observaciones_empresa: Optional[str] = None
    observaciones_docente: Optional[str] = None
