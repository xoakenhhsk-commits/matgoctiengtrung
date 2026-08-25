import re
from pypinyin import pinyin, Style, lazy_pinyin

# Bảng phân loại phụ âm và vận mẫu tiếng Trung chuẩn
ASPIRATED_PAIRS = {
    "b": "p", "p": "b",
    "d": "t", "t": "d",
    "g": "k", "k": "g",
    "j": "q", "q": "j",
    "zh": "ch", "ch": "zh",
    "z": "c", "c": "z"
}

RETROFLEX_PAIRS = {
    "zh": "z", "z": "zh",
    "ch": "c", "c": "ch",
    "sh": "s", "s": "sh"
}

TONE_DESCRIPTIONS = {
    1: "Thanh 1 (Âm cao, bằng phẳng 55) - Giữ giọng cao và đều, không thêm dấu.",
    2: "Thanh 2 (Âm đi lên 35 - tựa dấu sắc) - Kéo giọng từ trung bình lên cao dứt khoát.",
    3: "Thanh 3 (Âm trầm - uốn 214) - Hạ giọng thật thấp rồi đưa nhẹ lên cuối âm.",
    4: "Thanh 4 (Âm rơi mạnh 51 - dứt khoát) - Phát âm dứt khoát từ cao nhất hạ đột ngột xuống.",
    5: "Thanh nhẹ (Khinh thanh) - Đọc thật ngắn, nhẹ, lướt qua."
}

def get_pinyin_with_tones(text: str) -> str:
    """Chuyển đổi văn bản Chữ Hán thành Pinyin có dấu thanh điệu chuẩn."""
    if not text:
        return ""
    pinyin_list = lazy_pinyin(text, style=Style.TONE)
    return " ".join(pinyin_list)

def get_detailed_word_tokens(text: str) -> list[dict]:
    """Tách từng từ/ký tự kèm Pinyin và số thanh điệu để hiển thị UI tương tác."""
    if not text:
        return []
    
    tokens = []
    tone_items = pinyin(text, style=Style.TONE)
    tone_num_items = pinyin(text, style=Style.TONE3)
    
    for i, char in enumerate(text):
        if char.strip() == "":
            continue
        
        char_pinyin = tone_items[i][0] if i < len(tone_items) else ""
        char_pinyin_num = tone_num_items[i][0] if i < len(tone_num_items) else ""
        
        tone_match = re.search(r'\d', char_pinyin_num)
        tone_number = int(tone_match.group(0)) if tone_match else 5
        
        tokens.append({
            "hanzi": char,
            "pinyin": char_pinyin,
            "tone": tone_number,
            "is_chinese": bool(re.match(r'[\u4e00-\u9fff]', char))
        })
        
    return tokens

def analyze_phonetic_difference(expected_hanzi: str, expected_pinyin: str, expected_tone: int, heard_text: str, heard_pinyin: str) -> dict:
    """Phân tích chi tiết ngữ âm giữa từ đọc đúng và từ AI nghe được."""
    issue = ""
    tip = ""

    # Kiểm tra thanh điệu
    heard_tone_match = re.search(r'\d', pinyin(heard_text, style=Style.TONE3)[0][0] if heard_text else "")
    heard_tone = int(heard_tone_match.group(0)) if heard_tone_match else 0

    if heard_tone and heard_tone != expected_tone:
        issue = f"Nhầm Thanh {expected_tone} sang Thanh {heard_tone}"
        tip = TONE_DESCRIPTIONS.get(expected_tone, f"Chú ý phát âm chuẩn thanh {expected_tone}.")
    else:
        # Kiểm tra phụ âm bật hơi / uốn lưỡi
        exp_clean = re.sub(r'[^a-zA-Z]', '', expected_pinyin.lower())
        hrd_clean = re.sub(r'[^a-zA-Z]', '', heard_pinyin.lower())
        
        if exp_clean.startswith(("p", "t", "k", "q", "ch", "c")) and not hrd_clean.startswith(("p", "t", "k", "q", "ch", "c")):
            issue = f"Chưa bật hơi ở phụ âm đầu '{expected_pinyin[0]}'"
            tip = f"Khi đọc âm '{expected_pinyin[0]}', hãy nén luồng hơi lại và bật mạnh ra ngoài."
        elif exp_clean.startswith(("zh", "ch", "sh", "r")) and hrd_clean.startswith(("z", "c", "s")):
            issue = f"Chưa uốn lưỡi âm '{exp_clean[:2]}'"
            tip = f"Đầu lưỡi cần cong nhẹ chạm vào ngạc cứng trên khi phát âm '{exp_clean[:2]}'."
        else:
            issue = f"Khẩu hình hoặc phụ âm của chữ '{expected_hanzi}' chưa khớp"
            tip = f"Luyện đọc chậm chữ '{expected_hanzi}' ({expected_pinyin}), chú ý {TONE_DESCRIPTIONS.get(expected_tone, '')}"

    return {
        "word": expected_hanzi,
        "expected_pinyin": expected_pinyin,
        "heard_pinyin": heard_pinyin or "chưa rõ",
        "issue": issue,
        "tip": tip
    }
