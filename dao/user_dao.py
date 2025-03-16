from datetime import datetime
from typing import Optional
from passlib.context import CryptContext
from dao.mongodb import get_database
from models.user_models import User, UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserDAO:
    def __init__(self):
        self.db = get_database()
        self.users_collection = self.db.users

    async def init_admin(self):
        # Check if admin exists
        admin = await self.get_user_by_email("admin@familydash.com")
        if not admin:
            # Create admin user
            admin_user = UserCreate(
                email="admin@familydash.com",
                password="admin123",  # This should be changed in production
                is_admin=True,
                is_active=True
            )
            await self.create_user(admin_user)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        user_data = await self.users_collection.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None

    async def create_user(self, user: UserCreate) -> User:
        hashed_password = pwd_context.hash(user.password)
        user_data = {
            "email": user.email,
            "hashed_password": hashed_password,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": datetime.now()
        }
        await self.users_collection.insert_one(user_data)
        return User(**user_data)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not pwd_context.verify(password, user.hashed_password):
            return None
        return user

    def close(self):
        pass  # Connection is managed by the shared client
