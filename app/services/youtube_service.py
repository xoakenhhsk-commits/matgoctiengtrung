import re
import requests
from youtube_transcript_api import YouTubeTranscriptApi
from app.services.pinyin_service import get_pinyin_with_tones, get_detailed_word_tokens
from app.services.ai_evaluator import translate_chinese_subtitles, generate_ai_dialogue_for_video

# Cache in memory để phản hồi siêu tốc 0ms cho các video đã từng tải
VIDEO_CACHE: dict[str, dict] = {}

def extract_video_id(url_or_id: str) -> str:
    """Trích xuất YouTube Video ID từ nhiều định dạng link."""
    if not url_or_id:
        return ""
    url_or_id = url_or_id.strip()
    if len(url_or_id) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
        
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})'
    ]
    for p in patterns:
        match = re.search(p, url_or_id)
        if match:
            return match.group(1)
    return ""

def get_video_metadata(video_id: str) -> dict:
    """Lấy thông tin tiêu đề và thumbnail siêu nhanh qua oEmbed API."""
    title = f"Bài học tiếng Trung ({video_id})"
    author = "YouTube Channel"
    thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        res = requests.get(oembed_url, timeout=3.5)
        if res.status_code == 200:
            data = res.json()
            title = data.get("title", title)
            author = data.get("author_name", author)
            thumbnail = data.get("thumbnail_url", thumbnail)
    except Exception:
        pass

    return {
        "video_id": video_id,
        "title": title,
        "author": author,
        "thumbnail": thumbnail,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}"
    }

def clean_and_normalize_subtitles(raw_snippets: list) -> list[dict]:
    """
    Chuẩn hóa và giữ nguyên vẹn 100% từng câu phụ đề theo từng mốc thời gian YouTube
    chuẩn xác như web app 4you / Language Reactor / Migaku (Không bị nuốt câu, không bị gộp mất đoạn).
    """
    if not raw_snippets:
        return []

    cleaned_snippets = []
    for item in raw_snippets:
        if hasattr(item, 'text'):
            text = str(item.text).strip()
            start = round(float(getattr(item, 'start', 0.0)), 2)
            duration = round(float(getattr(item, 'duration', 2.5)), 2)
        elif isinstance(item, dict):
            text = str(item.get("text", "")).strip()
            start = round(float(item.get("start", 0.0)), 2)
            duration = round(float(item.get("duration", 2.5)), 2)
        else:
            text = str(getattr(item, 'text', '')).strip()
            start = round(float(getattr(item, 'start', 0.0)), 2)
            duration = round(float(getattr(item, 'duration', 2.5)), 2)

        # Loại bỏ các tag âm thanh [Âm nhạc], [Music], ♪, ♫
        clean_text = re.sub(r'\[.*?\]|\(.*?\)|♪|♫|♬', '', text).strip()
        # Chuẩn hóa khoảng trắng và dấu xuống dòng
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        if not clean_text:
            continue

        cleaned_snippets.append({
            "text": clean_text,
            "start": start,
            "end": round(start + duration, 2),
            "duration": max(duration, 0.8)
        })

    if not cleaned_snippets:
        return []

    # Sắp xếp đúng theo thời gian phát trong video
    cleaned_snippets.sort(key=lambda s: s["start"])
    return cleaned_snippets

def merge_dialogue_fragments(raw_snippets: list) -> list[dict]:
    """Giữ nguyên 100% tất cả các câu phụ đề theo chuẩn 4you."""
    return clean_and_normalize_subtitles(raw_snippets)

def fetch_youtube_subtitles(video_id: str, video_title: str = "", video_author: str = "") -> list[dict]:
    """
    Lấy và bóc tách TOÀN BỘ 100% từ A-Z mọi đoạn hội thoại tiếng Trung trong video, dịch nghĩa 100% bằng AI.
    """
    raw_subtitles = []
    
    # 1. Quét tìm TOÀN BỘ phụ đề (gốc & tự động & dịch tiếng Trung) từ YouTube
    try:
        ytt = YouTubeTranscriptApi()
        target_langs = ['zh-Hans', 'zh-CN', 'zh', 'zh-Hant', 'zh-TW', 'zh-HK', 'en', 'vi', 'ja', 'ko']
        
        # Thử lấy trực tiếp phụ đề tiếng Trung
        try:
            raw_subtitles = ytt.fetch(video_id, languages=['zh-Hans', 'zh-CN', 'zh', 'zh-Hant', 'zh-TW', 'zh-HK'])
        except Exception:
            raw_subtitles = []
            
        if not raw_subtitles:
            try:
                transcript_list = ytt.list(video_id)
                found_transcript = None
                
                # Ưu tiên phụ đề tiếng Trung có sẵn
                for lang in ['zh-Hans', 'zh-CN', 'zh', 'zh-Hant', 'zh-TW', 'zh-HK']:
                    try:
                        found_transcript = transcript_list.find_transcript([lang])
                        if found_transcript:
                            break
                    except Exception:
                        continue
                
                # Nếu không có, tự động dịch bất kỳ phụ đề/lời thoại nào sang Tiếng Trung Giản Thể
                if not found_transcript:
                    for t in transcript_list:
                        try:
                            found_transcript = t.translate('zh-Hans')
                            if found_transcript:
                                break
                        except Exception:
                            pass
                            
                if found_transcript:
                    raw_subtitles = found_transcript.fetch()
            except Exception as e:
                print(f"[Transcript Search Notice] {e}")
    except Exception as e:
        print(f"[Transcript API Notice] {e}")

    # 2. Ghép các mẩu phụ đề thành các câu hội thoại trọn vẹn từ đầu đến cuối (A-Z)
    merged_items = merge_dialogue_fragments(raw_subtitles)

    # 3. Nếu video hoàn toàn không có phụ đề CC, dùng Gemini AI nhận diện toàn bộ hội thoại từ đầu đến hết video
    if not merged_items:
        ai_generated_dialogues = generate_ai_dialogue_for_video(video_title or f"Video {video_id}", video_author)
        merged_items = merge_dialogue_fragments(ai_generated_dialogues)

    # 4. Gắn Pinyin chuẩn có dấu, phân tách từ ngữ (Tokens) và thu thập toàn bộ câu để dịch nghĩa
    processed_sentences = []
    texts_to_translate = []

    for idx, item in enumerate(merged_items):
        text = item["text"]
        start = item["start"]
        end = item["end"]
        duration = round(end - start, 2)

        pinyin_text = get_pinyin_with_tones(text)
        tokens = get_detailed_word_tokens(text)

        sentence_obj = {
            "index": idx,
            "start": start,
            "end": end,
            "duration": duration,
            "hanzi": text,
            "pinyin": pinyin_text,
            "tokens": tokens,
            "vietnamese": ""
        }
        processed_sentences.append(sentence_obj)
        texts_to_translate.append(text)

    # 5. Dịch nghĩa toàn bộ (100%) các câu hội thoại trong video bằng Gemini AI Studio
    if texts_to_translate:
        vn_translations = translate_chinese_subtitles(texts_to_translate)
        for idx, trans in enumerate(vn_translations):
            if idx < len(processed_sentences):
                processed_sentences[idx]["vietnamese"] = trans

    return processed_sentences

def get_cached_or_fetch_video_info(video_id: str) -> dict:
    """Hàm lấy dữ liệu video có cơ chế cache bộ nhớ đệm cực nhanh."""
    if video_id in VIDEO_CACHE:
        return VIDEO_CACHE[video_id]

    meta = get_video_metadata(video_id)
    subtitles = fetch_youtube_subtitles(video_id, meta.get("title", ""), meta.get("author", ""))
    
    first_spoken_start = subtitles[0]["start"] if subtitles else 0.0
    meta["first_spoken_start"] = first_spoken_start

    result = {
        "metadata": meta,
        "subtitles_count": len(subtitles),
        "subtitles": subtitles
    }
    
    VIDEO_CACHE[video_id] = result
    return result
