from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoResolution

def check_video_76():
    with Session(engine) as session:
        res = session.exec(select(VideoResolution).where(VideoResolution.video_id == 76)).all()
        print(f"Resolutions for video 76: {[r.resolution for r in res]}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env", override=True)
    check_video_76()
