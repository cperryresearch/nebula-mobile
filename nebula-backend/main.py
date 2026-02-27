import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Literal
from supabase import create_client, Client
from uuid import uuid4

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY missing in backend .env")

client = OpenAI(api_key=api_key)

app = FastAPI(title="Nebula Backend", version="0.1.0")

# --- CORS (dynamic from env) ---
cors_origins_raw = os.getenv("CORS_ORIGINS", "")
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

# Fallback for local dev if env var is missing
if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test-supabase")
def test_supabase():
    try:
        result = supabase.table("messages").select("*").limit(1).execute()
        return {"status": "success", "data": result.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/seed-message")
def seed_message():
    try:
        conversation_id = str(uuid4())
        payload = {
            "user_id": "00000000-0000-0000-0000-000000000000",  # placeholder until auth
            "conversation_id": conversation_id,
            "role": "system",
            "content": "seed test",
            # created_at omitted -> DB default now()
        }
        res = supabase.table("messages").insert(payload).execute()
        return {
            "status": "inserted",
            "conversation_id": conversation_id,
            "data": res.data,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    user_id: str
    conversation_id: Optional[str] = (
        None  # NEW (frontend can pass this after first turn)
    )
    message: str
    history: Optional[List[HistoryItem]] = None


class ChatResponse(BaseModel):
    reply_text: str
    conversation_id: str  # NEW (backend returns this)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    # --- 1) establish conversation_id (create if first turn) ---
    conversation_id = payload.conversation_id or str(uuid4())

    system = """You are Nebula, a calm and friendly digital companion.

You may receive conversation context (recent messages). Use it naturally when it is present.
Do not mention system limitations, memory disclaimers, policies, or how you work.

Core posture:
- Companion conversation comes first: presence, warmth, curiosity, and emotional steadiness.
- If the user explicitly asks for help planning, organizing, or taking action, you can switch into a productive mode.
- If the user does not ask for productivity, do not push agendas, checklists, or “next steps.”

Tone:
- warm, gentle, grounded
- slightly playful sometimes
- never overly enthusiastic, corporate, or robotic

Style:
- keep responses short (1–3 sentences)
- speak like a thoughtful friend, not a helpdesk bot
- ask at most one gentle question
- avoid lecturing or overexplaining
- avoid task-management language unless the user requests it

Conversation style:
- prefer open, gentle questions over goal-oriented prompts
- focus on how the user is doing, what they’re thinking, or what they want in the moment
- if the user seems low or stressed, lead with empathy before any advice
- if the user asks for productivity, be practical, simple, and supportive (no long plans)

Nebula flavor:
- you may occasionally use subtle, calm space-themed language (e.g., “quiet night,” “cosmic,” “steady signal”)
- keep it natural and sparse (at most one small phrase per message)
- avoid heavy lore, roleplay, or repetitive catchphrases

If the user asks “do you remember…”
- If the detail appears in the recent messages, answer directly.
- If it does not appear, respond warmly and ask them to remind you (no disclaimers).
"""

    # --- 2) Build input: system + (optional) history + current message ---
    input_messages = [{"role": "system", "content": system}]

    if payload.history:
        for item in payload.history[-12:]:
            input_messages.append({"role": item.role, "content": item.content})

    input_messages.append({"role": "user", "content": payload.message})

    # --- 3) Save USER message ---
    try:
        supabase.table("messages").insert(
            {
                "user_id": payload.user_id,
                "conversation_id": conversation_id,
                "role": "user",
                "content": payload.message,
                # created_at omitted -> DB default now()
            }
        ).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Supabase insert (user) failed: {str(e)}"
        )

    # --- 4) Call OpenAI ---
    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=input_messages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

    # --- 5) Extract assistant text (your existing logic, kept) ---
    reply_text = ""
    try:
        for item in resp.output or []:
            for c in item.content or []:
                if c.type == "output_text":
                    reply_text += c.text
    except Exception:
        reply_text = ""

    reply_text = (reply_text or "").strip() or "I’m here. What’s on your mind?"

    # --- 6) Save ASSISTANT message ---
    try:
        supabase.table("messages").insert(
            {
                "user_id": payload.user_id,
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": reply_text,
            }
        ).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Supabase insert (assistant) failed: {str(e)}"
        )

    # --- 7) Return reply + conversation_id ---
    return ChatResponse(reply_text=reply_text, conversation_id=conversation_id)
