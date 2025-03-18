from app.dao.airtable_dao import AirtableDAO
from app.models.models import (
    Company, Contact, Program, Event, 
    BlogPost, Sale, FundedCompany
)

class CompanyDAO(AirtableDAO[Company]):
    def __init__(self):
        super().__init__("Companies", Company)

class ContactDAO(AirtableDAO[Contact]):
    def __init__(self):
        super().__init__("Contacts", Contact)

class ProgramDAO(AirtableDAO[Program]):
    def __init__(self):
        super().__init__("Programs", Program)

class EventDAO(AirtableDAO[Event]):
    def __init__(self):
        super().__init__("Events", Event)

class BlogPostDAO(AirtableDAO[BlogPost]):
    def __init__(self):
        super().__init__("BlogPosts", BlogPost)

class SaleDAO(AirtableDAO[Sale]):
    def __init__(self):
        super().__init__("Sales", Sale)

class FundedCompanyDAO(AirtableDAO[FundedCompany]):
    def __init__(self):
        super().__init__("FundedCompanies", FundedCompany)
