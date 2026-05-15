from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
POSTGRES_URL = "postgresql://postgres:2463@localhost:5432/ragflow"

postgres_engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
session = sessionmaker(bind=postgres_engine)

def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()