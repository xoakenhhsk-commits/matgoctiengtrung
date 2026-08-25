import json
import os
import uuid
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    DATA_DIR = Path("/tmp/data")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
LESSONS_FILE = DATA_DIR / "lessons.json"

def load_lessons() -> list[dict]:
    """Đọc danh sách bài học đã lưu."""
    target_file = LESSONS_FILE
    if not target_file.exists():
        tmp_file = Path("/tmp/data/lessons.json")
        if tmp_file.exists():
            target_file = tmp_file
        else:
            return []
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Lesson Storage Read Error] {e}")
        return []

def save_lessons(lessons: list[dict]):
    """Ghi danh sách bài học vào file JSON."""
    try:
        with open(LESSONS_FILE, "w", encoding="utf-8") as f:
            json.dump(lessons, f, ensure_ascii=False, indent=2)
    except Exception as e:
        try:
            tmp_dir = Path("/tmp/data")
            tmp_dir.mkdir(parents=True, exist_ok=True)
            with open(tmp_dir / "lessons.json", "w", encoding="utf-8") as f:
                json.dump(lessons, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        print(f"[Lesson Storage Write Error] {e}")

def add_lesson(lesson_data: dict) -> dict:
    """Thêm bài học mới do Admin đăng."""
    lessons = load_lessons()
    
    new_lesson = {
        "id": str(uuid.uuid4())[:8],
        "title": lesson_data.get("title", "").strip(),
        "youtube_url": lesson_data.get("youtube_url", "").strip(),
        "video_id": lesson_data.get("video_id", "").strip(),
        "category": lesson_data.get("category", "Giao tiếp hàng ngày").strip(),
        "level": lesson_data.get("level", "HSK 3").strip(),
        "thumbnail": lesson_data.get("thumbnail", f"https://img.youtube.com/vi/{lesson_data.get('video_id')}/hqdefault.jpg"),
        "subtitles_count": lesson_data.get("subtitles_count", 0),
        "created_at": datetime.now().strftime("%d/%m/%Y %H:%M")
    }
    
    # Thêm vào đầu danh sách
    lessons.insert(0, new_lesson)
    save_lessons(lessons)
    return new_lesson

def delete_lesson(lesson_id: str) -> bool:
    """Xóa bài học theo ID."""
    lessons = load_lessons()
    initial_len = len(lessons)
    lessons = [l for l in lessons if l.get("id") != lesson_id]
    if len(lessons) != initial_len:
        save_lessons(lessons)
        return True
    return False
