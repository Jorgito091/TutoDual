from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class AcademicLoadBase(SQLModel):
    student_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    docente_id: int = Field(foreign_key="users.id", nullable=False)
    materia: str = Field(nullable=False)
    periodo: str = Field(nullable=False)
    calificacion_final: Optional[float] = Field(default=None)


class AcademicLoad(AcademicLoadBase, table=True):
    __tablename__ = "academic_load"

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

    __table_args__ = (
        sa.UniqueConstraint("student_id", "materia", "periodo", name="uq_student_materia_periodo"),
    )


class AcademicLoadCreate(AcademicLoadBase):
    pass


class AcademicLoadRead(AcademicLoadBase):
    id: int
    created_at: datetime
    updated_at: datetime


class AcademicLoadUpdate(SQLModel):
    calificacion_final: Optional[float] = None
    docente_id: Optional[int] = None
    materia: Optional[str] = None
    periodo: Optional[str] = None
