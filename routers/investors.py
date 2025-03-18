from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.models import Company, Contact, Program, Event, BlogPost, Sale, FundedCompany
from app.dao.table_daos import (
    CompanyDAO, ContactDAO, ProgramDAO, EventDAO,
    BlogPostDAO, SaleDAO, FundedCompanyDAO
)
from models.user_models import User
from app.auth.auth_utils import get_current_user

# Initialize DAOs
company_dao = CompanyDAO()
contact_dao = ContactDAO()
program_dao = ProgramDAO()
event_dao = EventDAO()
blog_dao = BlogPostDAO()
sale_dao = SaleDAO()
funded_company_dao = FundedCompanyDAO()

# Create separate routers for each entity
companies_router = APIRouter(tags=["VC Investors - Companies"])
contacts_router = APIRouter(tags=["VC Investors - Contacts"])
programs_router = APIRouter(tags=["VC Investors - Programs"])
events_router = APIRouter(tags=["VC Investors - Events"])
blog_posts_router = APIRouter(tags=["VC Investors - Blog Posts"])
sales_router = APIRouter(tags=["VC Investors - Sales"])
funded_companies_router = APIRouter(tags=["VC Investors - Previously Funded"])

# Company routes
@companies_router.post("", response_model=Company)
async def create_company(company: Company, current_user: User = Depends(get_current_user)):
    return await company_dao.create(company)

@companies_router.get("/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: User = Depends(get_current_user)):
    company = await company_dao.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@companies_router.get("", response_model=List[Company])
async def list_companies(current_user: User = Depends(get_current_user)):
    return await company_dao.list_all()

@companies_router.put("/{company_id}", response_model=Company)
async def update_company(
    company_id: str, 
    company: Company, 
    current_user: User = Depends(get_current_user)
):
    updated_company = await company_dao.update(company_id, company)
    if not updated_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return updated_company

@companies_router.delete("/{company_id}")
async def delete_company(company_id: str, current_user: User = Depends(get_current_user)):
    success = await company_dao.delete(company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}

# Contact routes
@contacts_router.post("", response_model=Contact)
async def create_contact(contact: Contact, current_user: User = Depends(get_current_user)):
    return await contact_dao.create(contact)

@contacts_router.get("/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    contact = await contact_dao.get_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@contacts_router.get("", response_model=List[Contact])
async def list_contacts(current_user: User = Depends(get_current_user)):
    return await contact_dao.list_all()

@contacts_router.get("/company/{company_id}", response_model=List[Contact])
async def get_contacts_by_company(
    company_id: str, 
    current_user: User = Depends(get_current_user)
):
    return await contact_dao.search("company", company_id)

@contacts_router.put("/{contact_id}", response_model=Contact)
async def update_contact(
    contact_id: str, 
    contact: Contact, 
    current_user: User = Depends(get_current_user)
):
    updated_contact = await contact_dao.update(contact_id, contact)
    if not updated_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return updated_contact

@contacts_router.delete("/{contact_id}")
async def delete_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    success = await contact_dao.delete(contact_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

# Program routes
@programs_router.post("", response_model=Program)
async def create_program(program: Program, current_user: User = Depends(get_current_user)):
    return await program_dao.create(program)

@programs_router.get("/{program_id}", response_model=Program)
async def get_program(program_id: str, current_user: User = Depends(get_current_user)):
    program = await program_dao.get_by_id(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program

@programs_router.get("", response_model=List[Program])
async def list_programs(current_user: User = Depends(get_current_user)):
    return await program_dao.list_all()

@programs_router.put("/{program_id}", response_model=Program)
async def update_program(
    program_id: str, 
    program: Program, 
    current_user: User = Depends(get_current_user)
):
    updated_program = await program_dao.update(program_id, program)
    if not updated_program:
        raise HTTPException(status_code=404, detail="Program not found")
    return updated_program

@programs_router.delete("/{program_id}")
async def delete_program(program_id: str, current_user: User = Depends(get_current_user)):
    success = await program_dao.delete(program_id)
    if not success:
        raise HTTPException(status_code=404, detail="Program not found")
    return {"message": "Program deleted successfully"}

# Event routes
@events_router.post("", response_model=Event)
async def create_event(event: Event, current_user: User = Depends(get_current_user)):
    return await event_dao.create(event)

@events_router.get("/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: User = Depends(get_current_user)):
    event = await event_dao.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@events_router.get("", response_model=List[Event])
async def list_events(current_user: User = Depends(get_current_user)):
    return await event_dao.list_all()

@events_router.put("/{event_id}", response_model=Event)
async def update_event(
    event_id: str, 
    event: Event, 
    current_user: User = Depends(get_current_user)
):
    updated_event = await event_dao.update(event_id, event)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event

@events_router.delete("/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    success = await event_dao.delete(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Blog Post routes
@blog_posts_router.post("", response_model=BlogPost)
async def create_blog_post(blog_post: BlogPost, current_user: User = Depends(get_current_user)):
    return await blog_dao.create(blog_post)

@blog_posts_router.get("/{post_id}", response_model=BlogPost)
async def get_blog_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await blog_dao.get_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

@blog_posts_router.get("", response_model=List[BlogPost])
async def list_blog_posts(current_user: User = Depends(get_current_user)):
    return await blog_dao.list_all()

@blog_posts_router.get("/company/{company_id}", response_model=List[BlogPost])
async def get_posts_by_company(
    company_id: str, 
    current_user: User = Depends(get_current_user)
):
    return await blog_dao.search("related_company", company_id)

@blog_posts_router.put("/{post_id}", response_model=BlogPost)
async def update_blog_post(
    post_id: str, 
    blog_post: BlogPost, 
    current_user: User = Depends(get_current_user)
):
    updated_post = await blog_dao.update(post_id, blog_post)
    if not updated_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return updated_post

@blog_posts_router.delete("/{post_id}")
async def delete_blog_post(post_id: str, current_user: User = Depends(get_current_user)):
    success = await blog_dao.delete(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted successfully"}

# Sales routes
@sales_router.post("", response_model=Sale)
async def create_sale(sale: Sale, current_user: User = Depends(get_current_user)):
    return await sale_dao.create(sale)

@sales_router.get("/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    sale = await sale_dao.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@sales_router.get("", response_model=List[Sale])
async def list_sales(current_user: User = Depends(get_current_user)):
    return await sale_dao.list_all()

@sales_router.get("/company/{company_id}", response_model=List[Sale])
async def get_sales_by_company(
    company_id: str, 
    current_user: User = Depends(get_current_user)
):
    return await sale_dao.search("company", company_id)

@sales_router.put("/{sale_id}", response_model=Sale)
async def update_sale(
    sale_id: str, 
    sale: Sale, 
    current_user: User = Depends(get_current_user)
):
    updated_sale = await sale_dao.update(sale_id, sale)
    if not updated_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return updated_sale

@sales_router.delete("/{sale_id}")
async def delete_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    success = await sale_dao.delete(sale_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"message": "Sale deleted successfully"}

# Funded Company routes
@funded_companies_router.post("", response_model=FundedCompany)
async def create_funded_company(company: FundedCompany, current_user: User = Depends(get_current_user)):
    return await funded_company_dao.create(company)

@funded_companies_router.get("/{company_id}", response_model=FundedCompany)
async def get_funded_company(company_id: str, current_user: User = Depends(get_current_user)):
    company = await funded_company_dao.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Funded company not found")
    return company

@funded_companies_router.get("", response_model=List[FundedCompany])
async def list_funded_companies(current_user: User = Depends(get_current_user)):
    return await funded_company_dao.list_all()

@funded_companies_router.put("/{company_id}", response_model=FundedCompany)
async def update_funded_company(
    company_id: str, 
    company: FundedCompany, 
    current_user: User = Depends(get_current_user)
):
    updated_company = await funded_company_dao.update(company_id, company)
    if not updated_company:
        raise HTTPException(status_code=404, detail="Funded company not found")
    return updated_company

@funded_companies_router.delete("/{company_id}")
async def delete_funded_company(company_id: str, current_user: User = Depends(get_current_user)):
    success = await funded_company_dao.delete(company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Funded company not found")
    return {"message": "Funded company deleted successfully"}

# Main router to include all sub-routers
router = APIRouter(prefix="/api/investors")

# Include all routers with their prefixes
router.include_router(companies_router, prefix="/companies")
router.include_router(contacts_router, prefix="/contacts")
router.include_router(programs_router, prefix="/programs")
router.include_router(events_router, prefix="/events")
router.include_router(blog_posts_router, prefix="/blog-posts")
router.include_router(sales_router, prefix="/sales")
router.include_router(funded_companies_router, prefix="/funded-companies")
