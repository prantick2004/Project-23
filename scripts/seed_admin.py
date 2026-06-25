"""
scripts/seed_admin.py
---------------------
Creates the first admin user in the database.
Run once after initial migration:
    python scripts/seed_admin.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings
from app.core.security import hash_password
from app.infrastructure.database.models.user import UserModel
from app.core.constants import UserRole

settings = get_settings()


async def seed_admin():
    engine = create_async_engine(settings.database_url)
    SessionFactory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        user = UserModel(
            username="admin",
            full_name="System Administrator",
            email="admin@project23.com",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        print("✅ Admin user created!")
        print("   Username : admin")
        print("   Password : admin123")
        print("   Role     : admin")
        print("\n⚠️  Change this password immediately after first login!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_admin())
