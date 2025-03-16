from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import logging
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from dao.finance_dao import FinanceDAO
from dao.user_dao import UserDAO
from models.financial_models import Income, Bill, Transaction
from models.user_models import UserCreate, User
from app.auth.auth_utils import (
    create_access_token,
    get_current_user,
    get_current_active_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from routers import bills

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

# Configure CORS
origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8001",
    "http://localhost:8001",
    "http://127.0.0.1",
    "http://localhost",
    "https://geniusforceai.github.io",
    "https://geniusforceai.github.io/FamilyDash"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize DAOs
finance_dao = FinanceDAO()
user_dao = UserDAO()

# Include routers
app.include_router(bills.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing admin user...")
    await user_dao.init_admin()
    logger.info("Server startup complete")

# Authentication endpoints
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"Login attempt for user: {form_data.username}")
    user = await user_dao.authenticate_user(form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Successful login for user: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/users/register", response_model=User)
async def register_user(user: UserCreate, current_user: User = Depends(get_current_active_admin)):
    db_user = await user_dao.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_dao.create_user(user)

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
            "/api/health",
            "/api/finances"
        ]
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for Railway
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    )

# Protected API Routes
@app.get("/api/finances", tags=["Financial Data"])
async def get_financial_data(current_user: User = Depends(get_current_user)):
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
            "payments": transactions
        }
    except Exception as e:
        logger.error("Error loading financial data: %s", str(e))
        raise HTTPException(status_code=500, detail="Error loading financial data")

@app.post("/api/finances", tags=["Financial Data"])
async def update_financial_data(data: dict, current_user: User = Depends(get_current_user)):
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
    user_dao.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
