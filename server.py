from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import json
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Baker Family Finances API",
    description="API for managing the Baker family's financial data including income and bills",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:43578",
        "http://127.0.0.1:43578"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)

# Pydantic models for data validation
class Bill(BaseModel):
    name: str = Field(..., description="Name of the bill")
    amount: float = Field(..., description="Amount of the bill")
    category: str = Field(..., description="Category of the bill (e.g., Housing, Transportation)")

class Income(BaseModel):
    biweekly: float = Field(..., description="Biweekly income amount")
    monthly: float = Field(..., description="Monthly income amount (calculated as 2x biweekly)")

class FinancialData(BaseModel):
    income: Income
    bills: List[Bill]

@app.get("/api/finances", response_model=FinancialData, tags=["Financial Data"])
async def get_financial_data():
    """
    Retrieve the current financial data including income and bills
    """
    try:
        with open('data/financial_data.json', 'r') as f:
            raw_data = json.load(f)
            logger.info("Financial data loaded successfully")
            logger.debug("Loaded data: %s", raw_data)
            data = FinancialData(**raw_data)
            return data
    except FileNotFoundError:
        logger.error("Financial data file not found")
        raise HTTPException(status_code=404, detail="Financial data not found")
    except Exception as e:
        logger.error("Error loading financial data: %s", str(e))
        raise HTTPException(status_code=500, detail="Error loading financial data")

@app.post("/api/finances", tags=["Financial Data"])
async def update_financial_data(data: FinancialData):
    """
    Update the financial data with new income or bill information
    """
    try:
        # Ensure data directory exists
        os.makedirs('data', exist_ok=True)
        
        # Write the data to the file
        with open('data/financial_data.json', 'w') as f:
            json.dump(data.dict(), f, indent=2)
        
        logger.info("Financial data updated successfully")
        logger.debug("Updated data: %s", data.dict())
        return data
    except Exception as e:
        logger.error("Error updating financial data: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
