from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Account(BaseModel):
    name: str
    balance: float
    type: str  # checking, savings, credit
    last_updated: datetime = Field(default_factory=datetime.now)

class Bill(BaseModel):
    id: Optional[str] = None
    name: str
    amount: float
    due_date: datetime
    category: str
    status: str = "pending"  # pending, paid, overdue
    payment_account: Optional[str] = None  # Reference to Account
    recurring: bool = False
    recurring_period: Optional[str] = None  # monthly, quarterly, yearly
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
