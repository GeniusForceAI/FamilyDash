from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.bills import Bill, Account
from dao.bills_dao import BillsDAO
from app.auth.auth_utils import get_current_user

# Remove trailing slash from prefix
router = APIRouter(prefix="/api/bills", tags=["bills"])
bills_dao = BillsDAO()

# Remove trailing slashes from all routes
@router.post("", response_model=str)
async def create_bill(bill: Bill, current_user: dict = Depends(get_current_user)):
    return await bills_dao.create_bill(bill)

@router.get("", response_model=List[Bill])
async def get_bills(status: str = None, current_user: dict = Depends(get_current_user)):
    return await bills_dao.get_bills(status)

@router.put("/{bill_id}", response_model=bool)
async def update_bill(bill_id: str, bill: Bill, current_user: dict = Depends(get_current_user)):
    return await bills_dao.update_bill(bill_id, bill)

@router.delete("/{bill_id}", response_model=bool)
async def delete_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    return await bills_dao.delete_bill(bill_id)

@router.get("/statistics", response_model=dict)
async def get_bill_statistics(current_user: dict = Depends(get_current_user)):
    return await bills_dao.get_bill_statistics()

# Account management endpoints - keep /accounts as it's part of the path
@router.post("/accounts", response_model=str)
async def create_account(account: Account, current_user: dict = Depends(get_current_user)):
    return await bills_dao.create_account(account)

@router.get("/accounts", response_model=List[Account])
async def get_accounts(current_user: dict = Depends(get_current_user)):
    return await bills_dao.get_accounts()

@router.put("/accounts/{account_id}", response_model=bool)
async def update_account(account_id: str, account: Account, current_user: dict = Depends(get_current_user)):
    return await bills_dao.update_account(account_id, account)
