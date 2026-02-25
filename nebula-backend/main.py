import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Literal

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY missing in backend .env")

client = OpenAI(api_key=api_key)

app = FastAPI(title="Nebula Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: Optional[List[HistoryItem]] = None


class ChatResponse(BaseModel):
    reply_text: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
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

    # Build input: system + (optional) history + current message
    input_messages = [{"role": "system", "content": system}]

    if payload.history:
        # Keep it bounded (avoid huge payloads)
        for item in payload.history[-12:]:
            # roles are already validated as "user" or "assistant"
            input_messages.append({"role": item.role, "content": item.content})

    input_messages.append({"role": "user", "content": payload.message})

    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=input_messages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

    # pull text from Responses output
    reply_text = ""
    try:
        for item in resp.output or []:
            for c in item.content or []:
                if c.type == "output_text":
                    reply_text += c.text
    except Exception:
        reply_text = ""

    reply_text = (reply_text or "").strip() or "I’m here. What’s on your mind?"

    return ChatResponse(reply_text=reply_text)
