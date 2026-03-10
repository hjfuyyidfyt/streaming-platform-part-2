from dotenv import load_dotenv
load_dotenv("backend/.env", override=True)

from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video

def check_video_details():
    with Session(engine) as session:
        video = session.get(Video, 76)
        if video:
            print(f"Video 76: Title={video.title}, Res={video.original_resolution}, Storage={video.storage_mode}")
        else:
            print("Video 76 not found.")

if __name__ == "__main__":
    check_video_details()
