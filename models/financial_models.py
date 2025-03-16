from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class Income(BaseModel):
    biweekly: Decimal
    monthly: Decimal
    last_updated: datetime = datetime.now()

class Bill(BaseModel):
    name: str
    amount: Decimal
    due_date: datetime
    category: str
    status: str
    payment_account: str
    recurring: bool
    recurring_period: Optional[str] = None

class Transaction(BaseModel):
    id: Optional[str] = None
    date: datetime
    description: str
    category: str
    amount: Decimal
    type: str  # 'income' or 'expense'
