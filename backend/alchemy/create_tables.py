from sqlalchemy import create_engine

from backend.alchemy.models import Base
from backend.settings.config import get_database_url

def create_tables():
    """Create tables for database"""
    try:
        engine = create_engine(get_database_url())
        Base.metadata.create_all(engine)
        
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {str(e)}")

if __name__ == "__main__":
    create_tables()