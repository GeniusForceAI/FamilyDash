#!/usr/bin/env python3
import os
import sys
import requests
import json

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app.config.airtable_config import get_airtable_settings
from app.models.models import (
    Company, Contact, Program, Event, 
    BlogPost, Sale, FundedCompany
)
from typing import Type
from pydantic import BaseModel

def get_field_type(python_type: Type) -> str:
    """Convert Python/Pydantic types to Airtable field types"""
    type_mapping = {
        str: 'singleLineText',
        int: 'number',
        float: 'number',
        bool: 'checkbox',
        list: 'multipleSelects',
        dict: 'richText',
    }
    return type_mapping.get(python_type, 'singleLineText')

def create_table_schema(model_class: Type[BaseModel]) -> dict:
    """Create Airtable table schema from Pydantic model"""
    fields = []
    
    # Get model fields excluding 'id' which is handled by Airtable
    for field_name, field in model_class.model_fields.items():
        if field_name == 'id':
            continue
            
        field_type = get_field_type(field.annotation)
        field_config = {
            "name": field_name,
            "type": field_type,
        }
        
        # Add options for select fields if specified in the model
        if hasattr(field, 'choices'):
            field_config["options"] = {"choices": [{"name": choice} for choice in field.choices]}
            
        fields.append(field_config)
    
    return {
        "description": f"Table for {model_class.__name__} records",
        "fields": fields
    }

def create_table(settings, table_name: str, schema: dict) -> str:
    """Create a table using Airtable REST API"""
    url = f"https://api.airtable.com/v0/meta/bases/{settings.AIRTABLE_BASE_ID}/tables"
    headers = {
        "Authorization": f"Bearer {settings.AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "name": table_name,
        "description": schema["description"],
        "fields": schema["fields"]
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        print(f"✓ Created table: {table_name}")
        return response.json()["id"]
    elif response.status_code == 422:
        print(f"Table {table_name} already exists")
        # Get table ID for field creation
        tables_response = requests.get(url, headers=headers)
        if tables_response.status_code == 200:
            tables = tables_response.json().get("tables", [])
            for table in tables:
                if table["name"] == table_name:
                    return table["id"]
        return None
    else:
        print(f"✗ Error creating table {table_name}: {response.text}")
        return None

def create_field(settings, table_id: str, field_config: dict) -> bool:
    """Create a field using Airtable REST API"""
    url = f"https://api.airtable.com/v0/meta/bases/{settings.AIRTABLE_BASE_ID}/tables/{table_id}/fields"
    headers = {
        "Authorization": f"Bearer {settings.AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json=field_config)
    if response.status_code == 200:
        print(f"  ✓ Added field: {field_config['name']}")
        return True
    elif response.status_code == 422 and "already exists" in response.text:
        print(f"  - Field already exists: {field_config['name']}")
        return True
    else:
        print(f"  ✗ Error adding field {field_config['name']}: {response.text}")
        return False

def init_tables():
    # Get Airtable settings
    settings = get_airtable_settings()
    
    # Define models and their table names
    tables = {
        "Companies": Company,
        "Contacts": Contact,
        "Programs": Program,
        "Events": Event,
        "BlogPosts": BlogPost,
        "Sales": Sale,
        "FundedCompanies": FundedCompany
    }
    
    # Create or update each table
    for table_name, model_class in tables.items():
        print(f"\nProcessing table: {table_name}")
        schema = create_table_schema(model_class)
        
        # First try to create the table
        table_id = create_table(settings, table_name, schema)
        if table_id:
            # If table exists/created, add fields
            for field in schema["fields"]:
                create_field(settings, table_id, field)

if __name__ == "__main__":
    init_tables()
