from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from bson import Decimal128, ObjectId
from dao.mongodb import get_database
from models.bills import Bill, Account

class BillsDAO:
    def __init__(self):
        self.db = get_database()
        self.bills_collection = self.db.bills
        self.accounts_collection = self.db.accounts

    async def create_bill(self, bill: Bill) -> str:
        bill_dict = bill.dict(exclude={'id'})
        bill_dict['_id'] = ObjectId()
        await self.bills_collection.insert_one(bill_dict)
        return str(bill_dict['_id'])

    async def get_bills(self, status: Optional[str] = None) -> List[Bill]:
        query = {}
        if status:
            query['status'] = status
        
        cursor = self.bills_collection.find(query)
        bills = []
        async for doc in cursor:
            doc['id'] = str(doc.pop('_id'))
            bills.append(Bill(**doc))
        return bills

    async def update_bill(self, bill_id: str, bill: Bill) -> bool:
        result = await self.bills_collection.update_one(
            {'_id': ObjectId(bill_id)},
            {'$set': {
                **bill.dict(exclude={'id'}),
                'updated_at': datetime.now()
            }}
        )
        return result.modified_count > 0

    async def delete_bill(self, bill_id: str) -> bool:
        result = await self.bills_collection.delete_one({'_id': ObjectId(bill_id)})
        return result.deleted_count > 0

    async def get_bill_statistics(self) -> dict:
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'total_amount': {'$sum': '$amount'},
                    'count': {'$sum': 1},
                    'avg_amount': {'$avg': '$amount'},
                    'categories': {
                        '$addToSet': '$category'
                    }
                }
            }
        ]
        result = await self.bills_collection.aggregate(pipeline).to_list(1)
        return result[0] if result else {}

    # Account management methods
    async def create_account(self, account: Account) -> str:
        account_dict = account.dict()
        account_dict['_id'] = ObjectId()
        await self.accounts_collection.insert_one(account_dict)
        return str(account_dict['_id'])

    async def get_accounts(self) -> List[Account]:
        cursor = self.accounts_collection.find()
        accounts = []
        async for doc in cursor:
            doc['id'] = str(doc.pop('_id'))
            accounts.append(Account(**doc))
        return accounts

    async def update_account(self, account_id: str, account: Account) -> bool:
        result = await self.accounts_collection.update_one(
            {'_id': ObjectId(account_id)},
            {'$set': {
                **account.dict(),
                'last_updated': datetime.now()
            }}
        )
        return result.modified_count > 0
