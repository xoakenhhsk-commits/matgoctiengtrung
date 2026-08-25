import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.config import (
    GEMINI_API_KEY, HOST, PORT,
    BANK_ID, ACCOUNT_NO, ACCOUNT_NAME, BANK_NAME,
    PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY
)
from app.services.youtube_service import extract_video_id, get_video_metadata, fetch_youtube_subtitles, get_cached_or_fetch_video_info
from app.services.ai_evaluator import evaluate_pronunciation
from app.services.lesson_storage import load_lessons, add_lesson, delete_lesson
from app.services.user_storage import (
    sync_user, get_user_by_email, upgrade_user_pro, get_all_users_admin,
    can_user_use_ai, consume_free_turn, FREE_MAX_TURNS
)

# PayOS Client Integration
payos_client = None
if PAYOS_CLIENT_ID and PAYOS_API_KEY and PAYOS_CHECKSUM_KEY:
    try:
        from payos import PayOS
        payos_client = PayOS(
            client_id=PAYOS_CLIENT_ID,
            api_key=PAYOS_API_KEY,
            checksum_key=PAYOS_CHECKSUM_KEY
        )
        print("[PayOS] PayOS Client initialized successfully.")
    except Exception as e:
        print(f"[PayOS Error] Could not initialize PayOS SDK: {e}")

# In-memory orders state
active_orders_db = {}

app = FastAPI(
    title="Chinese Shadowing AI Web App",
    description="Ứng dụng Luyện Nói Tiếng Trung Shadowing với Phụ đề YouTube & Chấm điểm AI Gemini",
    version="1.0.0"
)

# Cho phép CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class VideoRequest(BaseModel):
    url: str

class PronunciationRequest(BaseModel):
    target_text: str
    user_speech_text: Optional[str] = ""
    audio_base64: Optional[str] = ""
    mime_type: Optional[str] = "audio/webm"
    user_email: Optional[str] = ""

class AdminAddLessonRequest(BaseModel):
    youtube_url: str
    title: Optional[str] = ""
    category: Optional[str] = "Giao tiếp hàng ngày"
    level: Optional[str] = "HSK 3"

class SyncUserRequest(BaseModel):
    email: str
    name: Optional[str] = None
    photoURL: Optional[str] = None
    uid: Optional[str] = None
    plan: Optional[str] = None
    planType: Optional[str] = None
    planExpiresAt: Optional[str] = None
    planDays: Optional[int] = None
    free_usage_count: Optional[int] = None
    saved_vocabulary: Optional[list] = None
    favorite_sentences: Optional[list] = None
    replace_vocab: Optional[bool] = False
    replace_favorites: Optional[bool] = False
    progress: Optional[dict] = None
    settings: Optional[dict] = None

class AdminGrantProRequest(BaseModel):
    email: str
    days: Optional[int] = 30
    plan_type: Optional[str] = "month_30d"

@app.get("/api/status")
async def get_status():
    """Kiểm tra trạng thái server và cấu hình AI."""
    has_key = bool(os.getenv("GEMINI_API_KEY", GEMINI_API_KEY).strip())
    return {
        "status": "online",
        "gemini_configured": has_key,
        "model": "Gemini Flash / AI Studio",
        "features": ["YouTube Transcript", "Pinyin Engine", "Vietnamese Translation", "AI Pronunciation Assessment"]
    }

# ==========================================
# PUBLIC LESSONS APIS
# ==========================================
@app.get("/api/lessons")
async def get_all_lessons():
    """Lấy danh sách các bài học do Admin đã đăng cho người dùng học."""
    lessons = load_lessons()
    return {"lessons": lessons}

@app.get("/api/sample-videos")
async def get_samples_compat():
    """Tương thích ngược: trả về danh sách bài học đã đăng."""
    lessons = load_lessons()
    return {"samples": lessons}

# ==========================================
# ADMIN SECURITY & APIS (PASSWORD: Chauvadut@2010)
# ==========================================
import hmac
import hashlib
import time
from fastapi import Header

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Chauvadut@2010")
ADMIN_SECRET_SALT = "chinese_shadowing_chiba_secret_salt_2026"
failed_login_attempts = {}

class AdminLoginRequest(BaseModel):
    password: str

def generate_admin_token() -> str:
    """Tạo token phiên quản trị an toàn bằng HMAC-SHA256 với thời hạn 24 giờ."""
    expiry = int(time.time()) + 86400
    msg = f"admin_session:{expiry}"
    sig = hmac.new(ADMIN_SECRET_SALT.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return f"{expiry}:{sig}"

def verify_admin_token_str(token: Optional[str]) -> bool:
    """Xác thực token quản trị viên."""
    if not token or ":" not in token:
        return False
    try:
        expiry_str, sig = token.split(":", 1)
        expiry = int(expiry_str)
        if time.time() > expiry:
            return False
        msg = f"admin_session:{expiry}"
        expected_sig = hmac.new(ADMIN_SECRET_SALT.encode(), msg.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False

async def require_admin(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Dependency bảo vệ các API quản trị."""
    if not verify_admin_token_str(x_admin_token):
        raise HTTPException(
            status_code=401,
            detail="Truy cập bị từ chối. Vui lòng đăng nhập với quyền Admin!"
        )

@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    """Xác thực mật khẩu Admin bảo mật cao (chống dò mật khẩu)."""
    client_ip = "admin_client"
    attempts = failed_login_attempts.get(client_ip, {"count": 0, "locked_until": 0})
    
    if time.time() < attempts["locked_until"]:
        remain = int(attempts["locked_until"] - time.time())
        raise HTTPException(status_code=429, detail=f"Tài khoản bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau {remain} giây!")

    if req.password == ADMIN_PASSWORD:
        failed_login_attempts.pop(client_ip, None)
        token = generate_admin_token()
        return {
            "success": True,
            "message": "Đăng nhập Quản Trị Viên thành công!",
            "admin_token": token
        }
    else:
        attempts["count"] += 1
        if attempts["count"] >= 5:
            attempts["locked_until"] = time.time() + 900  # Khóa 15 phút nếu sai 5 lần
            failed_login_attempts[client_ip] = attempts
            raise HTTPException(status_code=429, detail="Bạn đã nhập sai mật khẩu quá 5 lần. Hệ thống đã khóa truy cập trong 15 phút!")
        
        failed_login_attempts[client_ip] = attempts
        remain_tries = 5 - attempts["count"]
        raise HTTPException(status_code=401, detail=f"Mật khẩu quản trị không chính xác! Còn {remain_tries} lần thử.")

@app.post("/api/admin/verify-token")
async def admin_verify_token(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Kiểm tra token admin còn hiệu lực không."""
    is_valid = verify_admin_token_str(x_admin_token)
    return {"valid": is_valid}

@app.post("/api/admin/lessons")
async def admin_create_lesson(req: AdminAddLessonRequest, x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """
    Admin đăng bài học mới qua link YouTube (Yêu cầu Token xác thực).
    """
    await require_admin(x_admin_token)

    video_id = extract_video_id(req.youtube_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Đường link YouTube không hợp lệ. Vui lòng kiểm tra lại!")

    # Lấy thông tin video
    meta = get_video_metadata(video_id)
    title = req.title.strip() if req.title and req.title.strip() else meta.get("title", f"Bài học tiếng Trung ({video_id})")
    
    # Kiểm tra số câu phụ đề
    subtitles = fetch_youtube_subtitles(video_id)

    new_lesson = add_lesson({
        "title": title,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        "video_id": video_id,
        "category": req.category or "Giao tiếp hàng ngày",
        "level": req.level or "HSK 3",
        "thumbnail": meta.get("thumbnail", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
        "subtitles_count": len(subtitles)
    })

    return {
        "success": True,
        "message": f"Đăng bài học '{title}' thành công!",
        "lesson": new_lesson
    }

@app.delete("/api/admin/lessons/{lesson_id}")
async def admin_remove_lesson(lesson_id: str, x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Admin xóa bài học khỏi hệ thống (Yêu cầu Token xác thực)."""
    await require_admin(x_admin_token)

    success = delete_lesson(lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học để xóa.")
    return {"success": True, "message": "Đã xóa bài học thành công."}

# ==========================================
# USER MULTI-DEVICE SYNC APIS (GOOGLE & EMAIL)
# ==========================================
@app.post("/api/user/sync")
async def api_sync_user(req: SyncUserRequest):
    """
    Đồng bộ dữ liệu người dùng đa thiết bị (Cloud Synchronization):
    - Đăng nhập trên bất kỳ điện thoại/máy tính nào bằng cùng 1 Gmail:
      + Tự động khôi phục quyền PRO VIP (hạn dùng, trạng thái)
      + Tự động đồng bộ Sổ tay từ vựng & Kho câu yêu thích
      + Tự động lưu tiến trình học tập & Cài đặt cá nhân
    """
    if not req.email:
        raise HTTPException(status_code=400, detail="Thiếu thông tin email người dùng.")
    
    try:
        user_dict = req.dict(exclude_none=True)
        user_data = sync_user(user_dict)
        return {
            "success": True,
            "message": "Đồng bộ dữ liệu tài khoản thành công!",
            "user": user_data
        }
    except Exception as e:
        print(f"[User Sync Error] {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi đồng bộ dữ liệu: {str(e)}")

@app.get("/api/user/profile/{email}")
async def api_get_user_profile(email: str):
    """Lấy thông tin và dữ liệu đã đồng bộ của người dùng theo email."""
    if not email:
        raise HTTPException(status_code=400, detail="Thiếu email.")
    user = get_user_by_email(email)
    if not user:
        return {"success": False, "exists": False, "message": "Chưa có dữ liệu người dùng này."}
    return {"success": True, "exists": True, "user": user}

@app.get("/api/admin/users")
async def admin_get_users(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Admin xem toàn bộ danh sách tài khoản đã đăng ký và trạng thái đồng bộ."""
    await require_admin(x_admin_token)
    users = get_all_users_admin()
    return {"success": True, "total": len(users), "users": users}

@app.post("/api/admin/users/grant-pro")
async def admin_grant_pro(req: AdminGrantProRequest, x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Admin cấp hoặc gia hạn quyền PRO VIP cho tài khoản Gmail bất kỳ."""
    await require_admin(x_admin_token)
    if not req.email:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp email học viên!")
    
    days = req.days or 30
    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=days)).strftime("%d/%m/%Y")
    updated_user = upgrade_user_pro(req.email, req.plan_type or "month_30d", days, expires_at)
    return {
        "success": True,
        "message": f"Đã cấp quyền PRO VIP ({days} ngày) cho {req.email} thành công!",
        "user": updated_user
    }

# ==========================================
# LEARNER & AI APIS
# ==========================================
@app.post("/api/video-info")
async def get_video_info(req: VideoRequest):
    """
    Trích xuất thông tin video YouTube, tải phụ đề tiếng Trung, sinh Pinyin và bản dịch tiếng Việt siêu tốc.
    """
    video_id = extract_video_id(req.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Đường link YouTube không hợp lệ. Vui lòng kiểm tra lại URL!")
    
    data = get_cached_or_fetch_video_info(video_id)
    
    return {
        "success": True,
        "metadata": data["metadata"],
        "subtitles_count": data["subtitles_count"],
        "subtitles": data["subtitles"]
    }

@app.post("/api/evaluate-pronunciation")
async def evaluate_speech(req: PronunciationRequest):
    """
    Chấm điểm phát âm tiếng Trung theo câu mẫu bằng Gemini AI Studio.
    Kiểm tra giới hạn 3 lượt dùng miễn phí cho tài khoản FREE.
    """
    if not req.target_text:
        raise HTTPException(status_code=400, detail="Thiếu câu mẫu tiếng Trung để chấm điểm.")
        
    can_use, remaining, plan = can_user_use_ai(req.user_email)
    if not can_use:
        return {
            "success": False,
            "quota_exceeded": True,
            "message": "Bạn đã sử dụng hết 3 lượt trải nghiệm AI miễn phí! Vui lòng nâng cấp tài khoản PRO VIP để tiếp tục luyện tập không giới hạn.",
            "remaining_turns": 0,
            "plan": "FREE"
        }

    result = evaluate_pronunciation(
        target_text=req.target_text,
        user_speech_text=req.user_speech_text or "",
        audio_base64=req.audio_base64 or "",
        mime_type=req.mime_type or "audio/webm"
    )
    
    new_remaining = consume_free_turn(req.user_email) if req.user_email else max(0, remaining - 1)

    return {
        "success": True,
        "result": result,
        "remaining_turns": new_remaining,
        "plan": plan
    }

# ==========================================
# PAYMENT VIETQR REALTIME & PRO UPGRADE
# ==========================================
import datetime

class CreatePaymentQRRequest(BaseModel):
    plan_type: str  # "week_7d" (2000đ) | "month_30d" (3000đ)
    user_email: str
    user_name: Optional[str] = "Học Viên"

class ConfirmPaymentRequest(BaseModel):
    order_code: str
    plan_type: str
    user_email: str

class GenerateFlashcardsRequest(BaseModel):
    video_id: Optional[str] = ""
    subtitles: list[dict]

@app.post("/api/payment/create-qr")
async def create_payment_qr(req: CreatePaymentQRRequest):
    """
    Sinh mã VietQR động chuẩn Ngân Hàng Việt Nam (kết hợp PayOS.vn tự động 100%).
    """
    plan_type = req.plan_type
    amount = 2000 if plan_type == "week_7d" else 3000
    plan_name = "Gói PRO 7 Ngày" if plan_type == "week_7d" else "Gói PRO 1 Tháng"
    days = 7 if plan_type == "week_7d" else 30

    order_int = int(time.time()) % 900000 + 100000
    order_code = f"CSPRO{order_int}"
    clean_email = req.user_email.split('@')[0][:8].upper()
    description = f"CS {order_code} {clean_email}"

    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=days)).strftime("%d/%m/%Y")

    active_orders_db[order_code] = {
        "status": "PENDING",
        "order_code": order_code,
        "order_int": order_int,
        "plan_type": plan_type,
        "user_email": req.user_email,
        "amount": amount,
        "expires_at": expires_at,
        "days": days,
        "created_at": time.time()
    }

    # 1. Nếu có cấu hình PayOS -> Sử dụng PayOS Gateway
    if payos_client:
        try:
            from payos.types import CreatePaymentLinkRequest
            payment_data = CreatePaymentLinkRequest(
                order_code=order_int,
                amount=amount,
                description=f"CS {order_int}",
                cancel_url="http://localhost:8000/",
                return_url="http://localhost:8000/"
            )
            payos_res = payos_client.payment_requests.create(payment_data)
            qr_display_url = f"https://api.vietqr.io/image/{payos_res.bin}-{payos_res.account_number}-compact2.jpg?amount={amount}&addInfo=CS {order_int}&accountName={payos_res.account_name}"
            return {
                "success": True,
                "provider": "payos",
                "order_code": order_code,
                "order_int": order_int,
                "plan_type": plan_type,
                "plan_name": plan_name,
                "amount": amount,
                "amount_formatted": f"{amount:,.0f}đ",
                "days": days,
                "description": f"CS {order_int}",
                "bank_name": "MBBank (Ngân Hàng Quân Đội)",
                "account_no": payos_res.account_number,
                "account_name": payos_res.account_name,
                "qr_url": qr_display_url,
                "checkout_url": getattr(payos_res, 'checkout_url', '')
            }
        except Exception as e:
            print(f"[PayOS] Fallback to direct VietQR due to: {e}")

    # 2. Mặc định: Sinh mã VietQR trực tiếp tới tài khoản MBBank chính chủ
    vietqr_url = f"https://api.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.jpg?amount={amount}&addInfo={description}&accountName={ACCOUNT_NAME}"

    return {
        "success": True,
        "provider": "vietqr",
        "order_code": order_code,
        "order_int": order_int,
        "plan_type": plan_type,
        "plan_name": plan_name,
        "amount": amount,
        "amount_formatted": f"{amount:,.0f}đ",
        "days": days,
        "description": description,
        "bank_name": BANK_NAME,
        "account_no": ACCOUNT_NO,
        "account_name": ACCOUNT_NAME,
        "qr_url": vietqr_url
    }

@app.get("/api/payment/check-status/{order_code}")
async def check_payment_status(order_code: str):
    """
    Kiểm tra trạng thái thanh toán Realtime (Polling từ Frontend).
    """
    order = active_orders_db.get(order_code)
    if not order:
        return {"success": False, "paid": False, "status": "NOT_FOUND"}

    # Nếu đã được đánh dấu PAID
    if order.get("status") == "PAID":
        # Đảm bảo tài khoản trên server được nâng cấp PRO
        if order.get("user_email"):
            upgrade_user_pro(order["user_email"], order.get("plan_type", "week_7d"), order.get("days", 7), order.get("expires_at", ""))
        return {
            "success": True,
            "paid": True,
            "status": "PAID",
            "plan_type": order.get("plan_type"),
            "expires_at": order.get("expires_at"),
            "days_valid": order.get("days")
        }

    # Nếu có PayOS -> Gọi API kiểm tra thanh toán
    if payos_client and order.get("order_int"):
        try:
            info = payos_client.payment_requests.get(order["order_int"])
            if info and getattr(info, 'status', '') == "PAID":
                order["status"] = "PAID"
                if order.get("user_email"):
                    upgrade_user_pro(order["user_email"], order.get("plan_type", "week_7d"), order.get("days", 7), order.get("expires_at", ""))
                return {
                    "success": True,
                    "paid": True,
                    "status": "PAID",
                    "plan_type": order.get("plan_type"),
                    "expires_at": order.get("expires_at"),
                    "days_valid": order.get("days")
                }
        except Exception as e:
            pass

    return {
        "success": True,
        "paid": False,
        "status": "PENDING"
    }

@app.post("/api/payment/payos-webhook")
async def payos_webhook(webhook_data: dict):
    """
    Webhook nhận thông báo biến động số dư Realtime từ PayOS.vn khi có chuyển khoản thành công.
    """
    try:
        if payos_client:
            verified = payos_client.verifyPaymentWebhookData(webhook_data)
            data = verified.get("data", {})
            order_int = data.get("orderCode")
            for code, order in active_orders_db.items():
                if order.get("order_int") == order_int:
                    order["status"] = "PAID"
                    if order.get("user_email"):
                        upgrade_user_pro(order["user_email"], order.get("plan_type", "week_7d"), order.get("days", 7), order.get("expires_at", ""))
                    print(f"[PayOS Webhook] Order {code} paid successfully for {order.get('user_email')}.")
                    break
        return {"success": True}
    except Exception as e:
        return {"success": False, "detail": str(e)}

@app.post("/api/payment/confirm")
async def confirm_payment(req: ConfirmPaymentRequest):
    """
    Xác nhận thanh toán STRICT PayOS: Chỉ mở khóa PRO khi PayOS xác nhận tiền đã vào tài khoản MBBank!
    """
    order = active_orders_db.get(req.order_code)
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã đơn hàng thanh toán.")

    is_paid = False

    # 1. Kiểm tra trạng thái trực tiếp trên PayOS
    if payos_client and order.get("order_int"):
        try:
            info = payos_client.payment_requests.get(order["order_int"])
            if info and getattr(info, 'status', '') == "PAID":
                order["status"] = "PAID"
                is_paid = True
        except Exception as e:
            print(f"[PayOS Check Error] {e}")

    if order.get("status") == "PAID":
        is_paid = True

    if not is_paid:
        raise HTTPException(
            status_code=400,
            detail="Hệ thống PayOS chưa nhận được khoản tiền từ ngân hàng của bạn. Vui lòng quét mã QR chuyển khoản đúng số tiền và nội dung!"
        )

    days = 7 if req.plan_type == "week_7d" else 30
    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=days)).strftime("%d/%m/%Y")

    # Lưu vĩnh viễn quyền PRO trên Server
    updated_user = upgrade_user_pro(req.user_email, req.plan_type, days, expires_at)

    return {
        "success": True,
        "message": f"🎉 Chúc mừng bạn đã nâng cấp thành công { 'Gói PRO 7 Ngày' if days == 7 else 'Gói PRO 1 Tháng' }!",
        "user_email": req.user_email,
        "plan": "PRO",
        "plan_type": req.plan_type,
        "activated_at": now.strftime("%d/%m/%Y %H:%M"),
        "expires_at": expires_at,
        "days_valid": days,
        "user": updated_user
    }

@app.post("/api/generate-flashcards")
async def generate_video_flashcards(req: GenerateFlashcardsRequest):
    """
    AI Gemini + Python NLP phân tích trích xuất 12-20 từ vựng quan trọng (HSK, khẩu ngữ, từ khóa hội thoại) kèm dịch nghĩa và câu ví dụ ngữ cảnh (Đặc quyền PRO).
    """
    subtitles = req.subtitles
    if not subtitles:
        raise HTTPException(status_code=400, detail="Chưa có phụ đề video để tạo flashcards.")

    # 1. Trích xuất toàn bộ câu thoại tiếng Trung & bản dịch từ video
    dialogue_lines = []
    for sub in subtitles:
        h = sub.get("hanzi", "").strip()
        v = sub.get("vietnamese", "").strip()
        if h:
            dialogue_lines.append(f"- {h} (Nghĩa: {v})")

    dialogue_context = "\n".join(dialogue_lines[:35]) # Lấy tối đa 35 câu thoại tiêu biểu

    # 2. Sử dụng Gemini AI để phân tích từ vựng chuyên sâu & dịch nghĩa chuẩn xác
    from app.services.ai_evaluator import call_gemini_generate_content
    prompt = f"""Bạn là một giáo sư ngôn ngữ học tiếng Trung Quốc hàng đầu. Dưới đây là các câu thoại hội thoại trong một video bài học tiếng Trung:

{dialogue_context}

Nhiệm vụ:
Hãy phân tích toàn bộ nội dung trên và trích xuất từ 12 đến 18 TỪ VỰNG QUAN TRỌNG NHẤT (bao gồm từ vựng cốt lõi HSK 1-6, khẩu ngữ giao tiếp thực tế, từ lóng, cụm từ trọng điểm xuất hiện trong bài).
Với mỗi từ, hãy tạo 1 Flashcard học tập chất lượng cao.

Trả về kết quả DUY NHẤT ở định dạng JSON hợp lệ (không kèm bất kỳ văn bản giải thích nào ngoài JSON):
{{
  "flashcards": [
    {{
      "id": 1,
      "hanzi": "Từ tiếng Trung (2-4 chữ)",
      "pinyin": "Pinyin chuẩn có dấu thanh",
      "vietnamese": "Nghĩa tiếng Việt chuẩn xác theo đúng ngữ cảnh bài nghe",
      "level": "Cấp độ (ví dụ: HSK 2, HSK 3, HSK 4 hoặc Khẩu ngữ)",
      "context_sentence": "Câu thoại tiếng Trung chứa từ này trích xuất từ bài",
      "context_pinyin": "Pinyin của câu thoại đó",
      "context_vn": "Dịch nghĩa tiếng Việt mượt mà của câu thoại đó"
    }}
  ]
}}"""
    try:
        text = call_gemini_generate_content(prompt, timeout=12)
        if text:
            import json, re
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                data = json.loads(match.group(0))
                cards = data.get("flashcards", [])
                if cards and len(cards) >= 5:
                    return {
                        "success": True,
                        "total_cards": len(cards),
                        "flashcards": cards
                    }
    except Exception as e:
        print(f"[Generate Flashcards AI Error] {e}")

    # 3. Fallback Python NLP: Trích xuất từ vựng từ tokens phụ đề
    import jieba
    from pypinyin import pinyin, Style
    flashcards = []
    seen_words = set()

    for sub in subtitles:
        hanzi = sub.get("hanzi", "")
        pinyin_sent = sub.get("pinyin", "")
        vn = sub.get("vietnamese", "")

        words = jieba.lcut(hanzi)
        for w in words:
            if len(w) >= 2 and w not in seen_words and not any(c in '，。！？、… 1234567890' for c in w):
                seen_words.add(w)
                py_list = pinyin(w, style=Style.TONE)
                w_pinyin = " ".join([p[0] for p in py_list])
                flashcards.append({
                    "id": len(flashcards) + 1,
                    "hanzi": w,
                    "pinyin": w_pinyin,
                    "vietnamese": vn.split(",")[0].split(".")[0] or "Từ vựng trong bài",
                    "context_sentence": hanzi,
                    "context_pinyin": pinyin_sent,
                    "context_vn": vn,
                    "level": "Hội thoại thực tế"
                })
            if len(flashcards) >= 15:
                break
        if len(flashcards) >= 15:
            break

    return {
        "success": True,
        "total_cards": len(flashcards),
        "flashcards": flashcards
    }

# ==========================================
# ADVANCED MULTI-MEANING VOCABULARY LOOKUP (PRO)
# ==========================================
class VocabLookupRequest(BaseModel):
    word: str
    context_sentence: Optional[str] = ""

@app.post("/api/vocab/lookup")
async def lookup_vocabulary(req: VocabLookupRequest):
    """
    Tra cứu từ vựng đa nghĩa, từ loại, phiên âm và ví dụ thực tế bằng Gemini AI hoặc từ điển chuyên sâu (Đặc quyền PRO).
    """
    word = req.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="Thiếu từ tiếng Trung cần tra cứu.")

    # Dùng Gemini AI nếu có cấu hình để phân tích sâu đa nghĩa
    from app.services.ai_evaluator import call_gemini_generate_content
    prompt = f"""Bạn là một chuyên gia giảng dạy tiếng Trung Quốc cao cấp. Hãy phân tích từ/cụm từ tiếng Trung "{word}" trong ngữ cảnh câu "{req.context_sentence}".
Trả về kết quả duy nhất ở định dạng JSON hợp lệ:
{{
    "hanzi": "{word}",
    "pinyin": "phiên âm pinyin có thanh điệu chuẩn",
    "word_type": "Từ loại (ví dụ: Danh từ, Động từ, Tính từ, Phó từ...)",
    "level": "Cấp độ HSK ước lượng (HSK 1-6 hoặc Khẩu ngữ)",
    "meanings": [
        "1. Nghĩa chính / phổ biến nhất kèm giải thích ngắn",
        "2. Nghĩa phụ / nghĩa mở rộng hoặc thành ngữ liên quan (nếu có)"
    ],
    "example_sentence": "Một câu ví dụ tiếng Trung tự nhiên",
    "example_pinyin": "Pinyin của câu ví dụ",
    "example_vietnamese": "Nghĩa tiếng Việt của câu ví dụ"
}}"""
    try:
        text = call_gemini_generate_content(prompt, timeout=10)
        if text:
            import json, re
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                data = json.loads(match.group(0))
                return {"success": True, "data": data}
    except Exception as e:
        print(f"[Vocab Lookup AI Error] {e}")

    # Fallback từ điển ngữ âm
    from pypinyin import pinyin, Style
    py_list = pinyin(word, style=Style.TONE)
    py_str = " ".join([p[0] for p in py_list])
    return {
        "success": True,
        "data": {
            "hanzi": word,
            "pinyin": py_str,
            "word_type": "Từ vựng tiếng Trung",
            "level": "Giao tiếp thực tế",
            "meanings": [
                f"1. Nghĩa trong câu: {req.context_sentence[:40] if req.context_sentence else word}",
                "2. Từ vựng cốt lõi thường gặp trong giao tiếp hàng ngày."
            ],
            "example_sentence": req.context_sentence or f"我们要经常练习{word}。",
            "example_pinyin": py_str,
            "example_vietnamese": "Chúng ta cần thường xuyên luyện tập từ này."
        }
    }

# ==========================================
# STATIC FILES & ADMIN ROUTE
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/admin")
async def serve_admin_page():
    """Phục vụ trang quản trị /admin."""
    admin_html = STATIC_DIR / "admin.html"
    if admin_html.exists():
        return FileResponse(str(admin_html))
    return FileResponse(str(STATIC_DIR / "index.html"))

app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
