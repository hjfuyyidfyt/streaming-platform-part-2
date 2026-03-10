from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSource

def inspect_sources(video_id):
    with Session(engine) as session:
        sources = session.exec(select(VideoSource).where(VideoSource.video_id == video_id)).all()
        print(f"Sources for Video {video_id}:")
        for s in sources:
            print(f"ID: {s.id}, Provider: {s.provider}, Resolution: {repr(s.resolution)}, FileID: {s.file_id}")

if __name__ == "__main__":
    inspect_sources(17)
