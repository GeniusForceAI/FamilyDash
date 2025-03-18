from pydantic_settings import BaseSettings
from functools import lru_cache

class AirtableSettings(BaseSettings):
    AIRTABLE_API_KEY: str
    AIRTABLE_BASE_ID: str
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # This will ignore extra env variables

@lru_cache()
def get_airtable_settings() -> AirtableSettings:
    return AirtableSettings()
