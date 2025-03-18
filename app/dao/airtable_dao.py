from pyairtable import Table
from app.config.airtable_config import get_airtable_settings
from typing import List, Optional, TypeVar, Generic, Type
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class AirtableDAO(Generic[T]):
    def __init__(self, table_name: str, model_class: Type[T]):
        settings = get_airtable_settings()
        self.table = Table(settings.AIRTABLE_API_KEY, settings.AIRTABLE_BASE_ID, table_name)
        self.model_class = model_class

    def _to_airtable_record(self, model: T) -> dict:
        data = model.model_dump(exclude={'id'})
        return {k: v for k, v in data.items() if v is not None}

    def _from_airtable_record(self, record: dict) -> T:
        return self.model_class(id=record['id'], **record['fields'])

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
        return [self._from_airtable_record(record) for record in records]

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
