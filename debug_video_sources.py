from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video
import json
from datetime import datetime

def serialize(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

def get_video_json(video_id):
    with Session(engine) as session:
        video = session.get(Video, video_id)
        if not video:
            print("Video not found")
            return
        
        # Explicitly load sources
        sources = video.sources
        print(f"Video {video_id} has {len(sources)} sources")
        for s in sources:
            print(f" - Provider: {s.provider}, Res: {s.resolution}, Embed: {s.embed_url}")
        
        # This simulates what the API returns (VideoPublic)
        # Note: In FastAPI, the response_model handles the serialization.
        # If the sources aren't in the response, maybe it's the response_model?
        
if __name__ == "__main__":
    get_video_json(16)
