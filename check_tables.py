import os
from dotenv import load_dotenv
load_dotenv("backend/.env", override=True)

from sqlmodel import Session, select, text
from backend.database import engine

def check_tables():
    print(f"Connecting to engine: {engine.url}")
    with Session(engine) as session:
        try:
            # Check if user table exists
            session.exec(text("SELECT 1 FROM \"user\" LIMIT 1"))
            print("User table exists!")
            
            # Check playlist
            session.exec(text("SELECT 1 FROM playlist LIMIT 1"))
            print("Playlist table exists!")
            
        except Exception as e:
            print(f"Error checking tables: {e}")

if __name__ == "__main__":
    check_tables()
