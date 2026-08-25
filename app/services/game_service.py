import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

CANDIDATE_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]

def get_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip().strip('"\'')

def chat_with_npc_ai(npc_id: str, npc_name: str, npc_title: str, player_message: str, chat_history: list = None) -> str:
    """
    Trò chuyện tương tác với NPC năm 1999 bằng Gemini AI.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return f"{npc_name}: 'Đêm nay là giao thừa 31/12/1999 rồi, cậu hãy chuẩn bị tinh thần bước sang năm 2000 đi!'"

    npc_prompts = {
        "lam_tinh": "Bạn là Lâm Tinh (ZeroCool), thiên tài hacker quán net 56k thập niên 90. Bạn ăn nói phong cách dân IT cổ điển, mê máy tính Pentium, đĩa mềm 1.44MB và mạng BBS. Bạn đang cảnh báo về sự cố Y2K.",
        "vy_vy": "Bạn là Vy Vy, cô gái chủ tiệm băng đĩa cassette bí ẩn năm 1999. Bạn ăn nói dịu dàng, hoài niệm, thích nhạc Hoa lời Việt và Walkman, nắm giữ bí mật về vòng lặp thời gian.",
        "inspector_truong": "Bạn là Thanh Tra Trương, đặc vụ quản lý dòng thời gian năm 1999. Bạn nghiêm túc, quyết đoán, điều tra các dị tượng sụp đổ của thế kỷ 20.",
        "y2k_bug": "Bạn là Bóng Ma Thiên Niên Kỷ (Y2K Bug), thực thể dữ liệu hỗn loạn sinh ra từ sự cố năm 2000, giọng điệu ma mị số hóa, muốn đóng băng thời gian ở 1999."
    }

    persona = npc_prompts.get(npc_id, f"Bạn là nhân vật {npc_name} ({npc_title}) sống ở ngày 31 tháng 12 năm 1999.")

    prompt = f"""
    {persona}
    Bối cảnh: Đêm giao thừa 31/12/1999, sự cố Y2K và dị tượng thời gian đang diễn ra.
    Người chơi ('Kẻ Ghi Nhớ') vừa nói với bạn: "{player_message}"

    Hãy nhập vai và trả lời bằng tiếng Việt tự nhiên, ngắn gọn (1 - 3 câu), đậm chất hoài niệm thập niên 1999 / công nghệ Y2K.
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300}
    }

    for model in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            r = requests.post(url, json=payload, timeout=4)
            if r.status_code == 200:
                txt = r.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if txt.strip():
                    return txt.strip()
        except Exception:
            continue

    return f"{npc_name}: 'Thời gian đang trôi nhanh quá, chỉ còn vài phút nữa là sang năm 2000 rồi!'"
