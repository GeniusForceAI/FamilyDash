import json
from datetime import datetime
from app.DataAccessLayer.finance_dao import FinanceDAO
from app.models.financial_models import Income, Bill, Transaction
import asyncio
from decimal import Decimal

async def migrate_data():
    # Load JSON data
    with open('data/financial_data.json', 'r') as f:
        json_data = json.load(f)
    
    # Initialize DAO
    dao = FinanceDAO()
    
    try:
        # Migrate income
        income = Income(
            biweekly=Decimal(str(json_data['income']['biweekly'])),
            monthly=Decimal(str(json_data['income']['monthly']))
        )
        await dao.update_income(income)
        print("✅ Income data migrated")
        
        # Migrate bills
        for bill_data in json_data['bills']:
            bill = Bill(
                name=bill_data['name'],
                amount=Decimal(str(bill_data['amount'])),
                category=bill_data['category'],
                is_recurring=True  # Default for existing bills
            )
            await dao.add_bill(bill)
        print(f"✅ {len(json_data['bills'])} bills migrated")
        
        # Migrate payments as transactions
        for payment in json_data['payments']:
            transaction = Transaction(
                date=datetime.fromisoformat(payment['date']),
                description=payment['description'],
                category=payment['category'],
                amount=Decimal(str(payment['amount'])),
                type="expense"
            )
            await dao.add_transaction(transaction)
        print(f"✅ {len(json_data['payments'])} payments migrated")
        
        print("\nMigration completed successfully! 🎉")
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
    finally:
        dao.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())
