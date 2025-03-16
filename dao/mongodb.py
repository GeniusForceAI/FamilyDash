import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database():
    mongodb_user = os.getenv("MONGODB_USER")
    mongodb_password = os.getenv("MONGODB_PASSWORD")
    uri = f"mongodb+srv://{mongodb_user}:{mongodb_password}@cluster0.dsutz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri, server_api=ServerApi('1'))
    return client.familydash
