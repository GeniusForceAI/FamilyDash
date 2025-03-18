from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Contact
from app.dao.table_daos import ContactDAO

router = APIRouter(prefix="/contacts", tags=["contacts"])
dao = ContactDAO()

@router.post("/", response_model=Contact)
async def create_contact(contact: Contact):
    return await dao.create(contact)

@router.get("/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    contact = await dao.get_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.get("/", response_model=List[Contact])
async def list_contacts():
    return await dao.list_all()

@router.put("/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact: Contact):
    updated_contact = await dao.update(contact_id, contact)
    if not updated_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return updated_contact

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    success = await dao.delete(contact_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

@router.get("/company/{company_id}", response_model=List[Contact])
async def get_contacts_by_company(company_id: str):
    return await dao.search("company", company_id)
