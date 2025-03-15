from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.DataAccessLayer.finance_dao import FinanceDAO
from app.models.financial_models import Income, Bill, Transaction

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
        "https://geniusforceai.github.io",  # Your GitHub Pages domain
        "http://localhost:3000",           # Local development
        "*"  # Allow all origins during development - remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize DAO
finance_dao = FinanceDAO()

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint that returns API information
    """
    return {
        "name": "Baker Family Finances API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/",
            "/health",
            "/api/finances"
        ]
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for Railway
    """
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "timestamp": datetime.now().isoformat()}
    )

# API Routes
@app.get("/api/finances", tags=["Financial Data"])
async def get_financial_data():
    """
    Retrieve the current financial data including income and bills
    """
    try:
        income = await finance_dao.get_income()
        bills = await finance_dao.get_bills()
        transactions = await finance_dao.get_transactions()
        
        logger.info("Financial data loaded successfully from MongoDB")
        return {
            "income": income,
            "bills": bills,
            "payments": transactions  # Note: we're using transactions but mapping to 'payments' for frontend compatibility
        }
    except Exception as e:
        logger.error("Error loading financial data: %s", str(e))
        raise HTTPException(status_code=500, detail="Error loading financial data")

@app.post("/api/finances", tags=["Financial Data"])
async def update_financial_data(data: dict):
    """
    Update the financial data with new income or bill information
    """
    try:
        # Update income
        if "income" in data:
            income = Income(**data["income"])
            await finance_dao.update_income(income)
        
        # Update bills
        if "bills" in data:
            # First, delete all existing bills
            existing_bills = await finance_dao.get_bills()
            for bill in existing_bills:
                await finance_dao.delete_bill(bill.name)
            
            # Then add new bills
            for bill_data in data["bills"]:
                bill = Bill(**bill_data)
                await finance_dao.add_bill(bill)
        
        # Update transactions/payments
        if "payments" in data:
            # First, get and delete all existing transactions
            existing_transactions = await finance_dao.get_transactions()
            for trans in existing_transactions:
                await finance_dao.delete_transaction(str(trans.id))
            
            # Then add new transactions
            for payment in data["payments"]:
                transaction = Transaction(
                    date=datetime.fromisoformat(payment["date"]),
                    description=payment["description"],
                    category=payment["category"],
                    amount=payment["amount"],
                    type="expense"
                )
                await finance_dao.add_transaction(transaction)
        
        logger.info("Financial data updated successfully in MongoDB")
        return await get_financial_data()
    except Exception as e:
        logger.error("Error updating financial data: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    finance_dao.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
