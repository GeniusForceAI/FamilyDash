from datetime import datetime
import motor.motor_asyncio
from bson import ObjectId
import os
from pymongo.server_api import ServerApi
from ..models.user_models import UserInDB, UserCreate, UserRole
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserDAO:
    def __init__(self):
        mongodb_user = os.getenv("MONGODB_USER")
        mongodb_password = os.getenv("MONGODB_PASSWORD")
        uri = f"mongodb+srv://{mongodb_user}:{mongodb_password}@cluster0.dsutz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        self.client = motor.motor_asyncio.AsyncIOMotorClient(uri, server_api=ServerApi('1'))
        self.db = self.client.familydash
        self.users = self.db.users

    async def init_admin(self):
        """Initialize admin user if not exists"""
        admin_exists = await self.users.find_one({"role": UserRole.ADMIN})
        if not admin_exists:
            admin_user = {
                "email": "admin@familydash.com",
                "role": UserRole.ADMIN,
                "hashed_password": pwd_context.hash("admin123"),  # Change this in production
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await self.users.insert_one(admin_user)
            logger.info("Admin user created successfully")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    async def get_user_by_email(self, email: str) -> UserInDB:
        user = await self.users.find_one({"email": email})
        if user:
            user["id"] = str(user.pop("_id"))
            return UserInDB(**user)
        return None

    async def create_user(self, user: UserCreate) -> UserInDB:
        # Check if email already exists
        existing_user = await self.get_user_by_email(user.email)
        if existing_user:
            raise ValueError("Email already registered")

        user_dict = user.dict()
        user_dict["hashed_password"] = self.get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await self.users.insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        del user_dict["_id"]
        return UserInDB(**user_dict)

    async def authenticate_user(self, email: str, password: str):
        user = await self.get_user_by_email(email)
        if not user:
            return False
        if not self.verify_password(password, user.hashed_password):
            return False
        return user

    def close(self):
        self.client.close()
