from pyairtable import Table
from app.config.airtable_config import get_airtable_settings
from typing import List, Optional, TypeVar, Generic, Type, Any
from pydantic import BaseModel, HttpUrl

T = TypeVar('T', bound=BaseModel)

class AirtableDAO(Generic[T]):
    def __init__(self, table_name: str, model_class: Type[T]):
        settings = get_airtable_settings()
        self.table = Table(settings.AIRTABLE_API_KEY, settings.AIRTABLE_BASE_ID, table_name)
        self.model_class = model_class

    def _convert_value(self, value: Any) -> Any:
        """Convert special types to Airtable-compatible values"""
        if isinstance(value, HttpUrl):
            return str(value)
        if isinstance(value, list):
            # For list fields, convert each item to string and join with commas
            # This matches Airtable's expected format for multiple select fields
            return ", ".join(str(self._convert_value(item)) for item in value if item)
        return value

    def _to_airtable_record(self, model: T) -> dict:
        data = model.model_dump(exclude={'id'})
        return {k: self._convert_value(v) for k, v in data.items() if v is not None}

    def _from_airtable_record(self, record: dict) -> T:
        fields = record['fields']
        
        # Add missing fields with default values based on model field types
        for field_name, field in self.model_class.model_fields.items():
            # Skip id field as it's handled separately
            if field_name == 'id':
                continue
                
            # Handle list fields (convert comma-separated strings to lists)
            if field_name in fields and isinstance(field.annotation, type(List)):
                if isinstance(fields[field_name], str):
                    fields[field_name] = [item.strip() for item in fields[field_name].split(",") if item.strip()]
            
            # Ensure all required fields have values
            if field_name not in fields:
                # Default empty list for List types
                if isinstance(field.annotation, type(List)):
                    fields[field_name] = []
                # Default empty string for str types
                elif field.annotation == str:
                    fields[field_name] = ""
                # Other types would need specific defaults as needed
        
        return self.model_class(id=record['id'], **fields)

    async def create(self, item: T) -> T:
        record = self.table.create(self._to_airtable_record(item))
        return self._from_airtable_record(record)

    async def get_by_id(self, id: str) -> Optional[T]:
        try:
            record = self.table.get(id)
            return self._from_airtable_record(record) if record else None
        except:
            return None

    async def list_all(self, formula: str = None) -> List[T]:
        records = self.table.all(formula=formula)
        result = []
        for record in records:
            try:
                # Try to convert the record, skip if it fails
                item = self._from_airtable_record(record)
                result.append(item)
            except Exception as e:
                print(f"Error converting record {record.get('id', 'unknown')}: {str(e)}")
                continue
        return result

    async def update(self, id: str, item: T) -> Optional[T]:
        try:
            record = self.table.update(id, self._to_airtable_record(item))
            return self._from_airtable_record(record)
        except:
            return None

    async def delete(self, id: str) -> bool:
        try:
            self.table.delete(id)
            return True
        except:
            return False

    async def search(self, field: str, value: str) -> List[T]:
        formula = f"{{{field}}} = '{value}'"
        return await self.list_all(formula=formula)
