from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import companies, contacts
from app.config.airtable_config import get_airtable_settings

app = FastAPI(title="Investor Network API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(companies.router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    # Verify Airtable connection
    settings = get_airtable_settings()
    if not settings.AIRTABLE_API_KEY or not settings.AIRTABLE_BASE_ID:
        raise Exception("Airtable configuration is missing")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Investor Network API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
