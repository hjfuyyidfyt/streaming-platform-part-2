import os
import sqlite3
import sqlalchemy
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Try to load from root or backend
load_dotenv(".env")
load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
        print(f"Migrating PostgreSQL: {DATABASE_URL[:50]}...")
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE video ADD COLUMN is_short BOOLEAN DEFAULT FALSE"))
                conn.commit()
                print("Successfully added is_short column to PostgreSQL.")
            except Exception as e:
                print(f"Error migrating PostgreSQL: {e}")
    else:
        print("Migrating SQLite...")
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "database.db")
        if not os.path.exists(db_path):
             db_path = "backend/database.db"
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("ALTER TABLE video ADD COLUMN is_short BOOLEAN DEFAULT FALSE")
            conn.commit()
            conn.close()
            print("Successfully added is_short column to SQLite.")
        except Exception as e:
            print(f"Error migrating SQLite: {e}")

if __name__ == "__main__":
    migrate()
