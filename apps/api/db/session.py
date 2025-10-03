from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

def get_session():
    return SessionLocal()
