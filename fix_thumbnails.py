from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video

def fix_thumbnails():
    with Session(engine) as session:
        videos = session.exec(select(Video)).all()
        count = 0
        for video in videos:
            if video.thumbnail_url and video.thumbnail_url.startswith("/static/thumbnails/"):
                new_url = f"/thumbnails/{video.id}"
                print(f"Fixing Video {video.id}: {video.thumbnail_url} -> {new_url}")
                video.thumbnail_url = new_url
                session.add(video)
                count += 1
        
        if count > 0:
            session.commit()
            print(f"Fixed {count} videos.")
        else:
            print("No videos needed fixing.")

if __name__ == "__main__":
    fix_thumbnails()
