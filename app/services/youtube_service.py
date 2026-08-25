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

def merge_dialogue_fragments(raw_snippets: list) -> list[dict]:
    """
    Kết hợp các mẩu phụ đề ngắn vụn của YouTube thành các câu hội thoại hoàn chỉnh và tự nhiên.
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

        # Loại bỏ các tag định dạng như [Âm nhạc], [Music], ♪, [Applause]
        clean_text = re.sub(r'\[.*?\]|\(.*?\)|♪|♫|♬', '', text).strip()
        if not clean_text or not re.search(r'[\u4e00-\u9fa5a-zA-Z0-9]', clean_text):
            continue

        cleaned_snippets.append({
            "text": clean_text,
            "start": start,
            "end": round(start + duration, 2),
            "duration": duration
        })

    if not cleaned_snippets:
        return []

    # Sắp xếp theo thứ tự thời gian
    cleaned_snippets.sort(key=lambda s: s["start"])

    merged_dialogues = []
    curr = cleaned_snippets[0].copy()

    for nxt in cleaned_snippets[1:]:
        # Điều kiện ghép câu:
        # 1. Câu hiện tại ngắn (< 10 ký tự) HOẶC thời lượng ngắn (< 2.8s)
        # 2. Khoảng cách giữa 2 mẩu nhỏ (< 1.2s)
        # 3. Câu hiện tại chưa kết thúc bằng dấu chấm câu (。！？!?.)
        is_short = len(curr["text"]) < 12 or (curr["end"] - curr["start"]) < 3.0
        gap = nxt["start"] - curr["end"]
        is_close = gap < 1.2
        no_end_punct = not re.search(r'[。！？!?.]\s*$', curr["text"])

        if is_short and is_close and no_end_punct:
            curr["text"] = f"{curr['text']} {nxt['text']}".strip()
            curr["end"] = max(curr["end"], nxt["end"])
            curr["duration"] = round(curr["end"] - curr["start"], 2)
        else:
            merged_dialogues.append(curr)
            curr = nxt.copy()

    merged_dialogues.append(curr)
    return merged_dialogues

def fetch_youtube_subtitles(video_id: str, video_title: str = "", video_author: str = "") -> list[dict]:
    """
    Lấy và bóc tách toàn bộ đoạn hội thoại tiếng Trung trong video, dịch nghĩa 100% bằng AI.
    """
    raw_subtitles = []
    
    # 1. Lấy phụ đề tiếng Trung từ YouTubeTranscriptApi
    try:
        ytt = YouTubeTranscriptApi()
        target_langs = ['zh-Hans', 'zh-CN', 'zh', 'zh-Hant', 'zh-TW', 'zh-HK', 'en', 'vi']
        
        try:
            raw_subtitles = ytt.fetch(video_id, languages=target_langs)
        except Exception:
            try:
                transcript_list = ytt.list(video_id)
                found_transcript = None
                for lang in target_langs:
                    try:
                        found_transcript = transcript_list.find_transcript([lang])
                        if found_transcript:
                            break
                    except Exception:
                        continue
                if not found_transcript:
                    for t in transcript_list:
                        try:
                            found_transcript = t.translate('zh-Hans')
                            break
                        except Exception:
                            pass
                if found_transcript:
                    raw_subtitles = found_transcript.fetch()
            except Exception:
                pass
    except Exception as e:
        print(f"[Transcript API Notice] {e}")

    # 2. Ghép các mẩu phụ đề thành các câu hội thoại trọn vẹn
    merged_items = merge_dialogue_fragments(raw_subtitles)

    # 3. Nếu video không có phụ đề CC gốc, dùng Gemini AI trích xuất / biên soạn đoạn hội thoại theo chủ đề video
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
