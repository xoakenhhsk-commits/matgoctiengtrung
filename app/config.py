import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=True)

def get_gemini_api_key() -> str:
    # Always reload from .env in case user edited it while server is running
    load_dotenv(BASE_DIR / ".env", override=True)
    raw = os.getenv("GEMINI_API_KEY", "").strip()
    return raw.strip('"\'')

GEMINI_API_KEY = get_gemini_api_key()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# ==========================================
# CẤU HÌNH TÀI KHOẢN NGÂN HÀNG THẬT (VIETQR) & PAYOS.VN
# ==========================================
BANK_ID = os.getenv("BANK_ID", "MB")               # Mã ngân hàng: MB, VCB, TCB, VPB, ACB, BIDV, TPB, CTG,...
ACCOUNT_NO = os.getenv("ACCOUNT_NO", "25006966778899") # Số tài khoản ngân hàng thật của bạn
ACCOUNT_NAME = os.getenv("ACCOUNT_NAME", "CHAU VA DUT") # Tên chủ tài khoản (viết hoa không dấu)
BANK_NAME = os.getenv("BANK_NAME", "MBBank (Ngân Hàng Quân Đội)") # Tên hiển thị ngân hàng

# PayOS.vn API Keys (Tự động nhận diện biến động số dư Realtime 100%)
PAYOS_CLIENT_ID = os.getenv("PAYOS_CLIENT_ID", "").strip().strip('"\'')
PAYOS_API_KEY = os.getenv("PAYOS_API_KEY", "").strip().strip('"\'')
PAYOS_CHECKSUM_KEY = os.getenv("PAYOS_CHECKSUM_KEY", "").strip().strip('"\'')

# Default Curated Sample Videos for Immediate Chinese Shadowing Practice
SAMPLE_VIDEOS = [
    {
        "id": "sample-1",
        "title": "🇨🇳 Học Tiếng Trung Giao Tiếp Hàng Ngày (HSK 3-4 Daily Talk)",
        "youtube_url": "https://www.youtube.com/watch?v=Fj7n0s8bFhQ",
        "level": "Cơ bản - Trung cấp (HSK 3)",
        "category": "Giao tiếp hàng ngày",
        "thumbnail": "https://img.youtube.com/vi/Fj7n0s8bFhQ/hqdefault.jpg"
    },
    {
        "id": "sample-2",
        "title": "🎵 Bài Hát Tiếng Trung Hay & Dễ Hát: 飞鸟和蝉 (Phi Điểu Và Thiền)",
        "youtube_url": "https://www.youtube.com/watch?v=UqQc7q3f1aA",
        "level": "Luyện nhịp & Nhạc Hoa",
        "category": "Âm nhạc / Luyện giọng",
        "thumbnail": "https://img.youtube.com/vi/UqQc7q3f1aA/hqdefault.jpg"
    },
    {
        "id": "sample-3",
        "title": "🎬 Đoạn Hội Thoại Phim Trung Quốc (Chinese Drama Short Clip)",
        "youtube_url": "https://www.youtube.com/watch?v=7X8II6J-6mU",
        "level": "Khẩu ngữ đời sống",
        "category": "Phim ảnh / Tự nhiên",
        "thumbnail": "https://img.youtube.com/vi/7X8II6J-6mU/hqdefault.jpg"
    }
]
