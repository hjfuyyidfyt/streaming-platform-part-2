from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSource

def add_dummy_res(video_id):
    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(select(VideoSource).where(VideoSource.video_id == video_id, VideoSource.resolution == "480p")).first()
        if existing:
            print("480p source already exists.")
            return

        source = VideoSource(
            video_id=video_id,
            provider="telegram",
            resolution="480p",
            file_id="DUMMY_FILE_ID_FOR_TEST"
        )
        session.add(source)
        session.commit()
        print(f"Added dummy 480p source for Video {video_id}")

if __name__ == "__main__":
    add_dummy_res(17)
