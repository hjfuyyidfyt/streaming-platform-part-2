import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Get all videos with placeholder URLs
cursor.execute("SELECT id, thumbnail_url FROM video")
videos = cursor.fetchall()

updated = 0
for vid_id, url in videos:
    if url and 'placeholder' in url.lower():
        new_url = f"http://localhost:8000/thumbnails/{vid_id}"
        cursor.execute("UPDATE video SET thumbnail_url = ? WHERE id = ?", (new_url, vid_id))
        updated += 1
        print(f"Updated video {vid_id}: {new_url}")

conn.commit()
print(f"\nTotal updated: {updated}")
