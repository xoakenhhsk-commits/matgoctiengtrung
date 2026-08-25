import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    DATA_DIR = Path("/tmp/data")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"

def load_users() -> Dict[str, Any]:
    """Đọc dữ liệu toàn bộ tài khoản người dùng từ file JSON."""
    target_file = USERS_FILE
    if not target_file.exists():
        tmp_file = Path("/tmp/data/users.json")
        if tmp_file.exists():
            target_file = tmp_file
        else:
            return {}
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[User Storage Read Error] {e}")
        return {}

def save_users(users: Dict[str, Any]):
    """Ghi dữ liệu người dùng vào file JSON an toàn."""
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    except Exception as e:
        try:
            tmp_dir = Path("/tmp/data")
            tmp_dir.mkdir(parents=True, exist_ok=True)
            with open(tmp_dir / "users.json", "w", encoding="utf-8") as f:
                json.dump(users, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        print(f"[User Storage Write Error] {e}")

def check_subscription_validity(user: Dict[str, Any]) -> Dict[str, Any]:
    """Kiểm tra và cập nhật trạng thái PRO dựa trên ngày hết hạn."""
    if user.get("plan") == "PRO":
        expires_str = user.get("planExpiresAt", "")
        if expires_str:
            try:
                # Format: DD/MM/YYYY or YYYY-MM-DD
                if "/" in expires_str:
                    parts = expires_str.split("/")
                    exp_date = datetime(int(parts[2]), int(parts[1]), int(parts[0]), 23, 59, 59)
                elif "-" in expires_str:
                    parts = expires_str.split("-")
                    exp_date = datetime(int(parts[0]), int(parts[1]), int(parts[2]), 23, 59, 59)
                else:
                    exp_date = None

                if exp_date and datetime.now() > exp_date:
                    user["plan"] = "FREE"
                    user["isExpired"] = True
                else:
                    user["isExpired"] = False
            except Exception as e:
                print(f"[Check Sub Error] {e}")
    return user

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin tài khoản theo email (chuẩn hóa chữ thường)."""
    if not email:
        return None
    users = load_users()
    email_key = email.strip().lower()
    user = users.get(email_key)
    if user:
        return check_subscription_validity(user)
    return None

def merge_list_by_key(server_list: List[dict], client_list: List[dict], key_type: str = "vocab") -> List[dict]:
    """Hợp nhất danh sách từ vựng/câu yêu thích giữa client và server không trùng lặp."""
    merged_map = {}
    
    def get_item_key(item: dict) -> str:
        if not isinstance(item, dict):
            return str(item)
        if key_type == "vocab":
            return (item.get("hanzi") or item.get("id") or str(item)).strip().lower()
        else: # favorites
            # Khóa kết hợp hanzi + start timestamp để xác định chính xác câu thoại
            hanzi = (item.get("hanzi") or "").strip()
            start = str(item.get("start", ""))
            return f"{hanzi}_{start}" if (hanzi or start) else (item.get("id") or str(item))

    # 1. Đưa server list vào map
    for item in (server_list or []):
        k = get_item_key(item)
        if k:
            merged_map[k] = item

    # 2. Hợp nhất client list (nếu mới hơn hoặc chưa có)
    for item in (client_list or []):
        k = get_item_key(item)
        if not k:
            continue
        if k in merged_map:
            # Ưu tiên bản ghi có thông tin mới hơn từ client
            merged_map[k] = {**merged_map[k], **item}
        else:
            merged_map[k] = item

    return list(merged_map.values())

def sync_user(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Đồng bộ dữ liệu đa thiết bị cho 1 Gmail:
    - Hồ sơ, Tên, Avatar
    - Trạng thái VIP/PRO & Hạn sử dụng
    - Sổ từ vựng đã lưu (Merge khi đăng nhập mới, Replace khi xóa từ)
    - Kho câu yêu thích (Merge khi đăng nhập mới, Replace khi xóa câu)
    - Tiến trình học tập & Cài đặt
    """
    email = payload.get("email", "").strip().lower()
    if not email:
        raise ValueError("Thiếu địa chỉ email để đồng bộ!")

    users = load_users()
    user = users.get(email, {})

    # 1. Khởi tạo cấu trúc dữ liệu nếu là user mới
    if not user:
        user = {
            "email": email,
            "name": payload.get("name") or email.split("@")[0],
            "photoURL": payload.get("photoURL") or f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            "uid": payload.get("uid") or f"user_{int(time.time())}",
            "plan": "FREE",
            "planType": "free",
            "planExpiresAt": "",
            "planDays": 0,
            "free_usage_count": int(payload.get("free_usage_count", 0)),
            "created_at": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "saved_vocabulary": [],
            "favorite_sentences": [],
            "progress": {},
            "settings": {},
            "last_synced": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }

    if "free_usage_count" in payload and payload.get("free_usage_count") is not None:
        user["free_usage_count"] = max(user.get("free_usage_count", 0), int(payload.get("free_usage_count", 0)))

    # 2. Cập nhật thông tin profile cơ bản nếu client gửi lên
    if payload.get("name"):
        user["name"] = payload.get("name")
    if payload.get("photoURL"):
        user["photoURL"] = payload.get("photoURL")
    if payload.get("uid"):
        user["uid"] = payload.get("uid")

    # 3. Đồng bộ VIP / PRO: Giữ nguyên PRO nếu server đã kích hoạt hoặc client mới nâng cấp
    if payload.get("plan") == "PRO" and payload.get("planExpiresAt"):
        # Nếu server chưa PRO hoặc client mang thông tin PRO mới hơn
        if user.get("plan") != "PRO":
            user["plan"] = "PRO"
            user["planType"] = payload.get("planType", "custom")
            user["planExpiresAt"] = payload.get("planExpiresAt")
            user["planDays"] = payload.get("planDays", 7)

    # Kiểm tra hạn dùng PRO trên Server
    user = check_subscription_validity(user)

    # 4. Sổ từ vựng (Saved Vocabulary)
    replace_vocab = payload.get("replace_vocab", False)
    client_vocab = payload.get("saved_vocabulary")
    if client_vocab is not None:
        if replace_vocab:
            # Client chủ động xóa/thay thế danh sách
            user["saved_vocabulary"] = client_vocab
        else:
            # Đăng nhập máy mới -> Hợp nhất 2 bên
            user["saved_vocabulary"] = merge_list_by_key(user.get("saved_vocabulary", []), client_vocab, key_type="vocab")

    # 5. Câu yêu thích (Favorites)
    replace_favs = payload.get("replace_favorites", False)
    client_favs = payload.get("favorite_sentences")
    if client_favs is not None:
        if replace_favs:
            # Client chủ động xóa/thay thế câu yêu thích
            user["favorite_sentences"] = client_favs
        else:
            # Đăng nhập máy mới -> Hợp nhất 2 bên
            user["favorite_sentences"] = merge_list_by_key(user.get("favorite_sentences", []), client_favs, key_type="favorites")

    # 6. Cập nhật tiến trình & cài đặt nếu có
    if payload.get("progress"):
        user["progress"] = {**user.get("progress", {}), **payload.get("progress")}
    if payload.get("settings"):
        user["settings"] = {**user.get("settings", {}), **payload.get("settings")}

    user["last_synced"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    users[email] = user
    save_users(users)

    return user

def upgrade_user_pro(email: str, plan_type: str, days: int, expires_at: str) -> Dict[str, Any]:
    """Nâng cấp PRO vĩnh viễn trên Server cho Gmail này."""
    email = email.strip().lower()
    users = load_users()
    user = users.get(email, {})

    if not user:
        user = {
            "email": email,
            "name": email.split("@")[0],
            "photoURL": f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            "created_at": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "saved_vocabulary": [],
            "favorite_sentences": [],
            "progress": {},
            "settings": {}
        }

    user["plan"] = "PRO"
    user["planType"] = plan_type
    user["planDays"] = days
    user["planExpiresAt"] = expires_at
    user["activated_at"] = datetime.now().strftime("%d/%m/%Y %H:%M")
    user["last_synced"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    users[email] = user
    save_users(users)
    return user

def get_all_users_admin() -> List[Dict[str, Any]]:
    """Danh sách người dùng cho trang Admin Quản Trị."""
    users = load_users()
    res = []
    for email, u in users.items():
        u_checked = check_subscription_validity(dict(u))
        res.append({
            "email": email,
            "name": u_checked.get("name", ""),
            "photoURL": u_checked.get("photoURL", ""),
            "plan": u_checked.get("plan", "FREE"),
            "planType": u_checked.get("planType", ""),
            "planExpiresAt": u_checked.get("planExpiresAt", ""),
            "vocab_count": len(u_checked.get("saved_vocabulary", [])),
            "fav_count": len(u_checked.get("favorite_sentences", [])),
            "free_usage_count": u_checked.get("free_usage_count", 0),
            "created_at": u_checked.get("created_at", ""),
            "last_synced": u_checked.get("last_synced", "")
        })
    return sorted(res, key=lambda x: x.get("last_synced", ""), reverse=True)

FREE_MAX_TURNS = 3

def can_user_use_ai(email: Optional[str]) -> tuple[bool, int, str]:
    """
    Kiểm tra quyền sử dụng tính năng AI (Luyện nói, Flashcard):
    - PRO: Không giới hạn (True, 999999, 'PRO')
    - FREE: Tối đa 3 lượt (True/False, remaining_turns, 'FREE')
    """
    if not email:
        return True, FREE_MAX_TURNS, "FREE"
    
    user = get_user_by_email(email)
    if not user:
        return True, FREE_MAX_TURNS, "FREE"
    
    if user.get("plan") == "PRO":
        return True, 999999, "PRO"
    
    used = int(user.get("free_usage_count", 0))
    remaining = max(0, FREE_MAX_TURNS - used)
    return (remaining > 0), remaining, "FREE"

def consume_free_turn(email: Optional[str]) -> int:
    """Tăng số lượt đã dùng của tài khoản FREE và trả về số lượt còn lại."""
    if not email:
        return 0
    users = load_users()
    email_key = email.strip().lower()
    user = users.get(email_key)
    if not user:
        return 0
    
    if user.get("plan") == "PRO":
        return 999999
    
    used = int(user.get("free_usage_count", 0)) + 1
    user["free_usage_count"] = used
    users[email_key] = user
    save_users(users)
    return max(0, FREE_MAX_TURNS - used)
