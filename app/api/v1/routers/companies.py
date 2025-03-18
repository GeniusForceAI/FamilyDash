from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Company
from app.dao.table_daos import CompanyDAO

router = APIRouter(prefix="/companies", tags=["companies"])
dao = CompanyDAO()

@router.post("/", response_model=Company)
async def create_company(company: Company):
    return await dao.create(company)

@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: str):
    company = await dao.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/", response_model=List[Company])
async def list_companies():
    return await dao.list_all()

@router.put("/{company_id}", response_model=Company)
async def update_company(company_id: str, company: Company):
    updated_company = await dao.update(company_id, company)
    if not updated_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return updated_company

@router.delete("/{company_id}")
async def delete_company(company_id: str):
    success = await dao.delete(company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}
