from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class ExternalProfileBase(SQLModel):
    user_id: int = Field(foreign_key="users.id", nullable=False, unique=True)
    empresa: Optional[str] = Field(default=None)
    cargo: Optional[str] = Field(default=None)
    linkedin_url: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    sector_industria: Optional[str] = Field(default=None)


class ExternalProfile(ExternalProfileBase, table=True):
    __tablename__ = "external_profiles"

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


class ExternalProfileCreate(ExternalProfileBase):
    pass


class ExternalProfileRead(ExternalProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ExternalProfileUpdate(SQLModel):
    empresa: Optional[str] = None
    cargo: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    sector_industria: Optional[str] = None
