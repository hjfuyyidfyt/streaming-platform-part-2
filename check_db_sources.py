from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSource
from backend.routers.admin import load_settings

def check():
    settings = load_settings()
    print(f"Active Providers Config: {[k for k, v in settings.storage_providers.items() if v['enabled']]}")

    with Session(engine) as session:
        # Get latest video
        video = session.exec(select(Video).order_by(Video.id.desc())).first()
        if not video:
            print("No videos found.")
            return

        print(f"Latest Video: ID={video.id}, Title='{video.title}'")
        print(f"Original Resolution: {video.original_resolution}")
        
        sources = session.exec(select(VideoSource).where(VideoSource.video_id == video.id)).all()
        print(f"Sources Found: {len(sources)}")
        for s in sources:
            print(f" - Provider: {s.provider}, Res: {s.resolution}, FileID: {s.file_id}")

if __name__ == "__main__":
    check()
