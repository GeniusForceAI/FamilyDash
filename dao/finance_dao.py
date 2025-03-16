from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from bson import Decimal128, ObjectId
from dao.mongodb import get_database
from models.financial_models import Income, Bill, Transaction

class FinanceDAO:
    def __init__(self):
        self.db = get_database()
        self.income_collection = self.db.income
        self.bills_collection = self.db.bills
        self.transactions_collection = self.db.transactions

    def _decimal_to_decimal128(self, value: Decimal) -> Decimal128:
        return Decimal128(str(value))

    def _decimal128_to_decimal(self, value: Decimal128) -> Decimal:
        return Decimal(str(value))

    # Income operations
    async def get_income(self) -> Optional[Income]:
        income_data = await self.income_collection.find_one()
        if not income_data:
            return None
        return Income(
            biweekly=self._decimal128_to_decimal(income_data["biweekly"]),
            monthly=self._decimal128_to_decimal(income_data["monthly"]),
            last_updated=income_data.get("last_updated", datetime.now())
        )

    async def update_income(self, income: Income) -> bool:
        income_dict = income.model_dump()
        income_dict["biweekly"] = self._decimal_to_decimal128(income.biweekly)
        income_dict["monthly"] = self._decimal_to_decimal128(income.monthly)
        result = await self.income_collection.replace_one(
            {}, income_dict, upsert=True
        )
        return result.acknowledged

    # Bills operations
    async def get_bills(self) -> List[Bill]:
        bills = []
        async for bill in self.bills_collection.find():
            bill["amount"] = self._decimal128_to_decimal(bill["amount"])
            bills.append(Bill(**bill))
        return bills

    async def add_bill(self, bill: Bill) -> bool:
        bill_dict = bill.model_dump()
        bill_dict["amount"] = self._decimal_to_decimal128(bill.amount)
        result = await self.bills_collection.insert_one(bill_dict)
        return result.acknowledged

    async def update_bill(self, bill_name: str, bill: Bill) -> bool:
        bill_dict = bill.model_dump()
        bill_dict["amount"] = self._decimal_to_decimal128(bill.amount)
        result = await self.bills_collection.replace_one(
            {"name": bill_name}, bill_dict
        )
        return result.modified_count > 0

    async def delete_bill(self, bill_name: str) -> bool:
        result = await self.bills_collection.delete_one({"name": bill_name})
        return result.deleted_count > 0

    # Transactions operations
    async def get_transactions(self, start_date: Optional[datetime] = None, 
                             end_date: Optional[datetime] = None) -> List[Transaction]:
        query = {}
        if start_date or end_date:
            query["date"] = {}
            if start_date:
                query["date"]["$gte"] = start_date
            if end_date:
                query["date"]["$lte"] = end_date

        transactions = []
        async for transaction in self.transactions_collection.find(query):
            transaction["amount"] = self._decimal128_to_decimal(transaction["amount"])
            transactions.append(Transaction(**transaction))
        return transactions

    async def add_transaction(self, transaction: Transaction) -> bool:
        transaction_dict = transaction.model_dump()
        transaction_dict["amount"] = self._decimal_to_decimal128(transaction.amount)
        result = await self.transactions_collection.insert_one(transaction_dict)
        return result.acknowledged

    async def delete_transaction(self, transaction_id: str) -> bool:
        result = await self.transactions_collection.delete_one({"_id": ObjectId(transaction_id)})
        return result.deleted_count > 0

    def close(self):
        pass  # Connection is managed by the shared client
