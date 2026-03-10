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
    output = {"videos": []}
    with Session(engine) as session:
        videos = session.exec(select(Video).order_by(Video.id.desc()).limit(3)).all()
        for v in videos:
            output["videos"].append({
                "id": v.id, "title": v.title, "storage_mode": v.storage_mode,
                "telegram_info": v.telegram_info.file_id if v.telegram_info else None,
                "resolutions": [r.resolution for r in v.resolutions],
                "sources": [(s.provider, s.resolution) for s in v.sources]
            })

    with open("db_output_63.json", "w") as f:
        json.dump(output, f, indent=2)

if __name__ == '__main__':
    run()
