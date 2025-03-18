from pydantic import BaseModel, HttpUrl, EmailStr
from typing import List, Optional
from datetime import date
from decimal import Decimal

class Company(BaseModel):
    id: Optional[str] = None
    company_name: str
    industry: str
    funding_programs: List[str] = []
    physical_address: str
    website: HttpUrl
    linkedin_page: HttpUrl
    key_contacts: List[str] = []
    recent_events: List[str] = []

class Contact(BaseModel):
    id: Optional[str] = None
    name: str
    position: str
    email: EmailStr
    linkedin_profile: HttpUrl
    company: str
    recent_posts: str

class Program(BaseModel):
    id: Optional[str] = None
    program_name: str
    description: str
    eligibility_criteria: str
    application_process: str
    funding_amount: Decimal

class Event(BaseModel):
    id: Optional[str] = None
    event_name: str
    date: date
    location: str
    keywords: List[str] = []
    target_audience: str

class BlogPost(BaseModel):
    id: Optional[str] = None
    post_title: str
    date: date
    content_summary: str
    engagement_metrics: int
    related_company: str

class Sale(BaseModel):
    id: Optional[str] = None
    product_name: str
    price: Decimal
    details: str
    company: str
    sales_metrics: int

class FundedCompany(BaseModel):
    id: Optional[str] = None
    company_name: str
    description: str
    funding_details: str
    funding_page_link: HttpUrl
    target_audience: str
