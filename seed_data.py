from sqlmodel import Session, select
from backend.database import engine
from backend.models import Category, Video, TelegramInfo
from datetime import datetime, timedelta
import random

def seed_data():
    with Session(engine) as session:
        # Check if data exists
        if session.exec(select(Category)).first():
            print("Data already exists. Skipping seed.")
            return

        print("Seeding data...")

        # Create Categories
        categories = [
            Category(name="Action", slug="action", description="High-octane action movies and clips"),
            Category(name="Comedy", slug="comedy", description="Funny videos to make you laugh"),
            Category(name="Drama", slug="drama", description="Compelling stories and emotional journeys"),
            Category(name="Tech", slug="tech", description="Latest in technology and gadgets"),
            Category(name="Gaming", slug="gaming", description="Gameplay, reviews, and diverse gaming content"),
            Category(name="Music", slug="music", description="Music videos and live performances"),
        ]
        
        for cat in categories:
            session.add(cat)
        session.commit()
        
        # Refresh to get IDs
        for cat in categories:
            session.refresh(cat)

        # Create Mock Videos
        videos = []
        for i in range(20):
            cat = random.choice(categories)
            video = Video(
                title=f"Sample Video {i+1}: {cat.name} Adventure",
                description=f"This is a sample description for video {i+1}. It belongs to the {cat.name} category.",
                thumbnail_url=f"https://picsum.photos/seed/{100+i}/640/360",
                duration=random.randint(60, 600),
                views=random.randint(100, 10000),
                upload_date=datetime.utcnow() - timedelta(days=random.randint(0, 365)),
                category_id=cat.id
            )
            videos.append(video)
            session.add(video)
        
        session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_data()
