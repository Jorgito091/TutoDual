from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class StudentVisibilityBase(SQLModel):
    student_id: int = Field(foreign_key="users.id", nullable=False)
    external_user_id: int = Field(foreign_key="users.id", nullable=False)
    can_view_grades: bool = Field(default=False)
    can_view_reports: bool = Field(default=False)


class StudentVisibility(StudentVisibilityBase, table=True):
    __tablename__ = "student_visibility"

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
        sa.UniqueConstraint("student_id", "external_user_id", name="uq_student_external"),
    )


class StudentVisibilityCreate(StudentVisibilityBase):
    pass


class StudentVisibilityRead(StudentVisibilityBase):
    id: int
    created_at: datetime
    updated_at: datetime


class StudentVisibilityUpdate(SQLModel):
    can_view_grades: Optional[bool] = None
    can_view_reports: Optional[bool] = None
