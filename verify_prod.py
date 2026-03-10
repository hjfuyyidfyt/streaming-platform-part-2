import os
from dotenv import load_dotenv
load_dotenv("backend/.env", override=True)

from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoResolution

def verify():
    with Session(engine) as session:
        v = session.get(Video, 76)
        if not v:
            print("Video 76 not found.")
            return
        
        print(f"Video: {v.title}")
        res = session.exec(select(VideoResolution).where(VideoResolution.video_id == 76)).all()
        print(f"Resolutions: {[r.resolution for r in res]}")

if __name__ == "__main__":
    verify()
