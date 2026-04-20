from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class CompanyBase(SQLModel):
    nombre: str = Field(nullable=False)
    rfc: str = Field(sa_column=Column(sa.String, unique=True, nullable=False))
    direccion: Optional[str] = Field(default=None)
    sector: Optional[str] = Field(default=None)
    contacto_nombre: Optional[str] = Field(default=None)
    contacto_email: Optional[str] = Field(default=None)
    contacto_telefono: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)


class Company(CompanyBase, table=True):
    __tablename__ = "companies"

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


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime


class CompanyUpdate(SQLModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    sector: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    is_active: Optional[bool] = None
