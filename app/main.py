import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from app.services.game_service import chat_with_npc_ai, get_gemini_api_key

app = FastAPI(
    title="Trở Về Năm 1999: Dị Tượng Y2K (Retro RPG Game)",
    description="Web Game Nhập Vai Phiêu Lưu Du Hành Thời Gian 1999 với Đồ Họa Retro Y2K & Tương Tác NPC AI",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory leaderboard & cloud saves
game_saves_db = {}
leaderboard_db = [
    {"player_name": "Lâm Tinh (ZeroCool)", "level": 10, "score": 9999, "role": "Hacker 56k"},
    {"player_name": "Vy Vy", "level": 8, "score": 7500, "role": "Chủ Tiệm Băng Đĩa"},
    {"player_name": "Thanh Tra Trương", "level": 7, "score": 6200, "role": "Đặc Vụ Thời Gian"}
]

# Models
class NpcChatRequest(BaseModel):
    npc_id: str
    npc_name: str
    npc_title: Optional[str] = "NPC 1999"
    player_message: str

class SaveGameRequest(BaseModel):
    player_name: str
    save_data: dict

@app.get("/api/status")
async def get_status():
    """Kiểm tra trạng thái Game Server."""
    return {
        "status": "online",
        "game": "Trở Về Năm 1999: Dị Tượng Y2K",
        "version": "2.0.0 Cyber-Edition",
        "ai_npc_enabled": bool(get_gemini_api_key())
    }

@app.post("/api/game/npc-chat")
async def api_npc_chat(req: NpcChatRequest):
    """
    Trò chuyện trực tiếp với các NPC năm 1999 (Lâm Tinh, Vy Vy, Thanh Tra Trương) bằng Gemini AI.
    """
    if not req.player_message.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung trò chuyện.")
    
    reply = chat_with_npc_ai(
        npc_id=req.npc_id,
        npc_name=req.npc_name,
        npc_title=req.npc_title,
        player_message=req.player_message
    )
    
    return {
        "success": True,
        "npc_id": req.npc_id,
        "npc_name": req.npc_name,
        "reply": reply
    }

@app.post("/api/game/save")
async def api_save_game(req: SaveGameRequest):
    """Lưu tiến trình người chơi lên Cloud Server."""
    if not req.player_name:
        raise HTTPException(status_code=400, detail="Thiếu tên người chơi.")
    
    game_saves_db[req.player_name] = req.save_data
    return {
        "success": True,
        "message": f"Đã lưu dữ liệu cho người chơi '{req.player_name}' thành công!"
    }

@app.get("/api/game/load/{player_name}")
async def api_load_game(player_name: str):
    """Tải tiến trình người chơi từ Cloud Server."""
    save_data = game_saves_db.get(player_name)
    if not save_data:
        return {"success": False, "message": "Không tìm thấy dữ liệu lưu."}
    return {"success": True, "save_data": save_data}

@app.get("/api/game/leaderboard")
async def api_get_leaderboard():
    """Bảng xếp hạng Người Du Hành Thời Gian xuất sắc nhất năm 1999."""
    return {
        "success": True,
        "leaderboard": leaderboard_db
    }

# ==========================================
# STATIC FILES SERVING (RETRO RPG FRONTEND)
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

@app.get("/")
async def serve_game_root():
    """Phục vụ màn hình Game chính."""
    return FileResponse(str(STATIC_DIR / "index.html"))

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="root_static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
