from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal

class Income(BaseModel):
    biweekly: Decimal = Field(..., description="Biweekly income amount")
    monthly: Decimal = Field(..., description="Monthly income amount")
    last_updated: datetime = Field(default_factory=datetime.now)

class Bill(BaseModel):
    name: str = Field(..., description="Name of the bill")
    amount: Decimal = Field(..., description="Bill amount")
    category: str = Field(..., description="Bill category")
    is_recurring: bool = Field(default=True, description="Whether the bill is recurring")
    due_date: Optional[int] = Field(None, description="Day of month when bill is due", ge=1, le=31)

class Transaction(BaseModel):
    date: datetime = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description")
    category: str = Field(..., description="Transaction category")
    amount: Decimal = Field(..., description="Transaction amount")
    type: str = Field(..., description="Transaction type (expense/income)")
