import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

async def populate_mock_data():
    # Initialize MongoDB connection using the same pattern as FinanceDAO
    mongodb_user = os.getenv("MONGODB_USER")
    mongodb_password = os.getenv("MONGODB_PASSWORD")
    uri = f"mongodb+srv://{mongodb_user}:{mongodb_password}@cluster0.dsutz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri, server_api=ServerApi('1'))
    db = client.familydash

    # Clear existing bills and accounts collections
    await db.bills.delete_many({})
    await db.accounts.delete_many({})

    # Current date for reference
    current_date = datetime.now()

    # Mock Accounts Data - Reflecting recent employment
    accounts = [
        {
            "name": "Main Checking",
            "balance": 8500.00,  # Recent savings from new job
            "type": "checking",
            "last_updated": current_date
        },
        {
            "name": "Emergency Fund",
            "balance": 3000.00,  # Starting to build emergency fund
            "type": "savings",
            "last_updated": current_date
        },
        {
            "name": "Credit Card",
            "balance": 2500.00,  # Some debt from entrepreneur days
            "type": "credit",
            "last_updated": current_date
        }
    ]

    # Insert accounts
    await db.accounts.insert_many(accounts)

    # Bills Data - Last 4 months showing transition
    bills = []

    # 4 months ago - Struggling entrepreneur phase
    four_months_ago = current_date - timedelta(days=120)
    bills.extend([
        {
            "name": "Shared Apartment Rent",
            "amount": 800.00,  # Split rent with roommates
            "due_date": four_months_ago,
            "category": "rent",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Phone Bill",
            "amount": 45.00,  # Budget plan
            "due_date": four_months_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Credit Card",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "AWS Hosting",
            "amount": 150.00,  # Startup expenses
            "due_date": four_months_ago,
            "category": "subscriptions",
            "status": "paid",
            "payment_account": "Credit Card",
            "recurring": True,
            "recurring_period": "monthly"
        }
    ])

    # 3 months ago - Transition period
    three_months_ago = current_date - timedelta(days=90)
    bills.extend([
        {
            "name": "Shared Apartment Rent",
            "amount": 800.00,
            "due_date": three_months_ago,
            "category": "rent",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Phone Bill",
            "amount": 45.00,
            "due_date": three_months_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Credit Card",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Moving Expenses",
            "amount": 500.00,  # One-time moving cost
            "due_date": three_months_ago,
            "category": "other",
            "status": "paid",
            "payment_account": "Credit Card",
            "recurring": False
        }
    ])

    # 2 months ago - First month at new job
    two_months_ago = current_date - timedelta(days=60)
    bills.extend([
        {
            "name": "New Apartment Rent",
            "amount": 2200.00,  # Upgraded living situation
            "due_date": two_months_ago,
            "category": "rent",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Utilities",
            "amount": 150.00,
            "due_date": two_months_ago,
            "category": "utilities",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Internet",
            "amount": 80.00,
            "due_date": two_months_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Phone Bill",
            "amount": 85.00,  # Upgraded phone plan
            "due_date": two_months_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Furniture Payment",
            "amount": 800.00,
            "due_date": two_months_ago,
            "category": "other",
            "status": "paid",
            "payment_account": "Credit Card",
            "recurring": False
        }
    ])

    # 1 month ago - Settled into new lifestyle
    one_month_ago = current_date - timedelta(days=30)
    bills.extend([
        {
            "name": "Apartment Rent",
            "amount": 2200.00,
            "due_date": one_month_ago,
            "category": "rent",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Utilities",
            "amount": 165.00,
            "due_date": one_month_ago,
            "category": "utilities",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Internet",
            "amount": 80.00,
            "due_date": one_month_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Phone Bill",
            "amount": 85.00,
            "due_date": one_month_ago,
            "category": "phone",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Gym Membership",
            "amount": 50.00,  # New wellness expense
            "due_date": one_month_ago,
            "category": "subscriptions",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "AI Development Courses",
            "amount": 199.00,  # Professional development
            "due_date": one_month_ago,
            "category": "subscriptions",
            "status": "paid",
            "payment_account": "Main Checking",
            "recurring": False
        }
    ])

    # Current month - Including some upcoming bills
    bills.extend([
        {
            "name": "Apartment Rent",
            "amount": 2200.00,
            "due_date": current_date + timedelta(days=15),  # Upcoming
            "category": "rent",
            "status": "pending",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Utilities",
            "amount": 160.00,
            "due_date": current_date + timedelta(days=10),
            "category": "utilities",
            "status": "pending",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Internet",
            "amount": 80.00,
            "due_date": current_date + timedelta(days=8),
            "category": "phone",
            "status": "pending",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Phone Bill",
            "amount": 85.00,
            "due_date": current_date + timedelta(days=12),
            "category": "phone",
            "status": "pending",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        },
        {
            "name": "Gym Membership",
            "amount": 50.00,
            "due_date": current_date + timedelta(days=5),
            "category": "subscriptions",
            "status": "pending",
            "payment_account": "Main Checking",
            "recurring": True,
            "recurring_period": "monthly"
        }
    ])

    # Insert all bills
    await db.bills.insert_many(bills)

    print(f"Successfully inserted {len(accounts)} accounts and {len(bills)} bills into the database.")
    print("\nAccounts Summary:")
    for account in accounts:
        print(f"- {account['name']}: ${account['balance']:,.2f}")

    print("\nBills Timeline:")
    for i, period in enumerate(["4 months ago", "3 months ago", "2 months ago", "1 month ago", "Current/Upcoming"]):
        period_bills = bills[i*5:(i+1)*5]
        total = sum(bill['amount'] for bill in period_bills)
        print(f"\n{period}:")
        print(f"Total: ${total:,.2f}")
        for bill in period_bills:
            print(f"- {bill['name']}: ${bill['amount']:,.2f}")

    client.close()

if __name__ == "__main__":
    asyncio.run(populate_mock_data())
