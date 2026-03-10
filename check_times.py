from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSource

def check_times(video_id):
    with Session(engine) as session:
        sources = session.exec(select(VideoSource).where(VideoSource.video_id == video_id).order_by(VideoSource.created_at)).all()
        print(f"Sources for Video {video_id}:")
        for s in sources:
            print(f"[{s.created_at}] Provider: {s.provider}, Resolution: {s.resolution}")

if __name__ == "__main__":
    check_times(18)
