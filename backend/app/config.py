from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Use SQLite for local dev/testing, PostgreSQL for production
    database_url: str = os.environ.get(
        "DATABASE_URL",
        "sqlite:///./fiber_management.db"
    )
    secret_key: str = "your-secret-key-change-in-production-minimum-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
