import os
import sys
import json
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, "backend/.env"))
sys.path.append(current_dir)

from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video

def run():
    output = {"videos_18_19": [], "latest_5": []}
    with Session(engine) as session:
        videos = session.exec(select(Video).where(Video.title.in_(['18', '19'])).order_by(Video.id.desc())).all()
        for v in videos:
            output["videos_18_19"].append({
                "id": v.id, "title": v.title, "storage_mode": v.storage_mode,
                "telegram_info": v.telegram_info.file_id if v.telegram_info else None,
                "resolutions": [r.resolution for r in v.resolutions],
                "sources": [(s.provider, s.resolution) for s in v.sources]
            })

        latest = session.exec(select(Video).order_by(Video.id.desc()).limit(5)).all()
        for v in latest:
            output["latest_5"].append({
                "id": v.id, "title": v.title, "storage_mode": v.storage_mode,
                "duration": v.duration, "category": v.category_id,
                "thumbnail_url": v.thumbnail_url, "video_id_type": type(v.id).__name__
            })

    with open("db_output.json", "w") as f:
        json.dump(output, f, indent=2)

if __name__ == '__main__':
    run()
