"""
Database initialization and seeding script.
Run this file from the streaming_platform directory:
    python seed_db.py
"""
import sys
import os

# Add the parent directory to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel, Session
from backend.database import engine
from backend.models import Category, Video

def init_and_seed():
    print("Creating all database tables...")
    SQLModel.metadata.create_all(engine)
    print("Tables created!")
    
    # Seed categories
    categories = [
        Category(name="Action", slug="action"),
        Category(name="Comedy", slug="comedy"),
        Category(name="Drama", slug="drama"),
        Category(name="Horror", slug="horror"),
        Category(name="Documentary", slug="documentary"),
        Category(name="Music", slug="music"),
        Category(name="Gaming", slug="gaming"),
        Category(name="News", slug="news"),
    ]
    
    with Session(engine) as session:
        # Check if categories already exist
        existing = session.exec(session.query(Category)).first() if hasattr(session, 'query') else None
        
        # Simple check - try to add, skip if exists
        for cat in categories:
            try:
                # Check if exists
                from sqlmodel import select
                existing_cat = session.exec(select(Category).where(Category.slug == cat.slug)).first()
                if not existing_cat:
                    session.add(cat)
                    print(f"  Added category: {cat.name}")
                else:
                    print(f"  Category already exists: {cat.name}")
            except Exception as e:
                print(f"  Skipping {cat.name}: {e}")
        
        session.commit()
        print("\nDatabase seeded successfully!")

if __name__ == "__main__":
    init_and_seed()
