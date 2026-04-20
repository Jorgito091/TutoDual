from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import TokenData, get_current_token_data
from app.database import get_session
from app.models.companies import Company, CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: CompanyCreate,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    if token.role not in ("ADMINISTRADOR",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    existing = session.exec(select(Company).where(Company.rfc == company_in.rfc)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFC ya registrado")
    company = Company(**company_in.model_dump())
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.get("/", response_model=List[CompanyRead])
def list_companies(
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    return session.exec(select(Company)).all()


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: int,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return company


@router.patch("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    session: Session = Depends(get_session),
    token: TokenData = Depends(get_current_token_data),
):
    if token.role != "ADMINISTRADOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos")
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    update_data = company_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)
    session.add(company)
    session.commit()
    session.refresh(company)
    return company
