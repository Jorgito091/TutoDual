import enum
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column, String
import sqlalchemy as sa


class UserRole(str, enum.Enum):
    ALUMNO = "ALUMNO"
    DOCENTE = "DOCENTE"
    ADMINISTRADOR = "ADMINISTRADOR"
    EXTERNO = "EXTERNO"


class UserBase(SQLModel):
    email: str = Field(sa_column=Column(String, unique=True, nullable=False, index=True))
    role: UserRole = Field(sa_column=Column(sa.Enum(UserRole), nullable=False, index=True))
    nombre: str = Field(nullable=False)
    apellido: str = Field(nullable=False)
    matricula_o_nomina: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str = Field(nullable=False)
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


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime


class UserUpdate(SQLModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    matricula_o_nomina: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
