import { useEffect, useMemo, useRef, useState } from "react";
import curious from "./images/curious.png";
import thinking from "./images/cosmic-map.png";
import talking from "./images/radiant.png";
import blink from "./images/nebula_blink.png";

function App() {
  const [message, setMessage] = useState("");

  const [nebulaState, setNebulaState] = useState("idle");
const spriteMap = {
  idle: curious,
  thinking: thinking,
  talking: talking,
  blink: blink,
};

const [blinkOn, setBlinkOn] = useState(false);

const startedRef = useRef(false);
const t1Ref = useRef(null);
const t2Ref = useRef(null);

const lastBlinkAtRef = useRef(0);
useEffect(() => {
  if (startedRef.current) return;
  startedRef.current = true;

  const scheduleNextBlink = () => {
    const next = 10000 + Math.random() * 8000; // 10–18s

    t1Ref.current = window.setTimeout(() => {
      const now = Date.now();
      const elapsed = now - lastBlinkAtRef.current;

      // enforce minimum 8s between blinks (extra safety)
      if (elapsed < 8000) {
        const wait = 8000 - elapsed + 200;
        t1Ref.current = window.setTimeout(scheduleNextBlink, wait);
        return;
      }

      lastBlinkAtRef.current = now;
      setBlinkOn(true);

      t2Ref.current = window.setTimeout(() => {
        setBlinkOn(false);
        scheduleNextBlink();
      }, 500);
    }, next);
  };

  scheduleNextBlink();

  return () => {
    if (t1Ref.current) window.clearTimeout(t1Ref.current);
    if (t2Ref.current) window.clearTimeout(t2Ref.current);
  };
}, []);

const [bounceOn, setBounceOn] = useState(false);

const triggerBounce = () => {
  setBounceOn(true);
  window.setTimeout(() => setBounceOn(false), 450);
};

const setTemporaryState = (state, duration = 2000) => {
  setNebulaState(state);

  window.setTimeout(() => {
    setNebulaState("idle");
  }, duration);
};

  const greetings = [
    "Hey… I’m here. 🌙",
    "Welcome back.",
    "Good to see you again.",
    "The stars are quiet tonight.",
    "Hi… what’s on your mind?",
  ];

  const initialGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "nebula",
      content: initialGreeting,
      ts: Date.now(),
    },
  ]);

  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);

  // Load messages from localStorage once on startup
useEffect(() => {
  try {
    const raw = localStorage.getItem("nebula_messages");
    if (raw) setMessages(JSON.parse(raw));
  } catch {
    // ignore
  }
}, []);

// Save messages whenever they change
useEffect(() => {
  try {
    localStorage.setItem("nebula_messages", JSON.stringify(messages));
  } catch {
    // ignore
  }
}, [messages]);

  // Auto-scroll to bottom when messages or loading changes
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const canSend = useMemo(
    () => message.trim().length > 0 && !loading,
    [message, loading]
  );

  // ---- MEMORY HELPER (ADD THIS) ----
  const buildHistoryPayload = (msgs, limit = 12) => {
    return msgs.slice(-limit).map((m) => ({
      role: m.role === "nebula" ? "assistant" : "user",
      content: m.content,
    }));
  };

  const clearChat = () => {
    try {
      localStorage.removeItem("nebula_messages");
    } catch {
      // ignore
    }

    const freshGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    setMessages([
      {
        id: crypto.randomUUID(),
        role: "nebula",
        content: freshGreeting,
        ts: Date.now(),
      },
    ]);
  };

  const sendMessage = async () => {
    triggerBounce();
    const text = message.trim();
    if (!text || loading) return;

    setNebulaState("thinking");

    // ---- BUILD HISTORY BEFORE WE PUSH THE NEW USER MESSAGE ----
    const history = buildHistoryPayload(messages, 12);

    // 1) Push user message
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // 2) Clear input + set loading
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "frontend-user",
          message: text,
          history: history, // <-- SEND HISTORY
        }),
      });

      const data = await res.json();
      const replyText = data.reply_text || "(no reply)";
     
      setTemporaryState("talking");

      const nebulaMsg = {
        id: crypto.randomUUID(),
        role: "nebula",
        content: replyText,
        ts: Date.now(),
      };

setMessages((prev) => [...prev, nebulaMsg]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "nebula",
          content:
            "I felt a little cosmic turbulence… but I’m still here. Try again in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

return (
  <div style={styles.page}>
    <style>{`
      @keyframes nebulaFloat {
        0% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-10px) scale(1.03); }
        100% { transform: translateY(0px) scale(1); }
      }

      @keyframes nebulaPulse {
        0%, 100% { filter: drop-shadow(0 0 8px rgba(170,120,255,0.25)); }
        50% { filter: drop-shadow(0 0 18px rgba(170,120,255,0.6)); }
      }
    `}</style>

    {/* NEW: centered single-column container */}
    <div style={styles.container}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Nebula</h1>
              <div style={styles.subtitle}>Mobile • Phase 2: Experience</div>
            </div>

            <button onClick={clearChat} style={styles.clearButton} type="button">
              Clear chat
            </button>
          </div>
        </header>

        {/* STAGE (Phase 2.1) */}
        <div style={styles.stage}>
          <div style={styles.stageGlow} />

          <img
            src={blinkOn ? spriteMap["blink"] : spriteMap[nebulaState]}
            alt="Nebula"
            draggable={false}
            style={{
              ...styles.sprite,
              ...(loading ? styles.spriteThinking : styles.spriteIdle),
              ...(bounceOn ? styles.spriteBounce : null),
            }}
          />
        </div>

        <div ref={listRef} style={styles.chatList}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                ...styles.row,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.userBubble : styles.nebulaBubble),
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.row, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.nebulaBubble, opacity: 0.85 }}>
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div style={styles.composer}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Say something to Nebula…"
            style={styles.input}
            rows={2}
          />

          <button onClick={sendMessage} disabled={!canSend} style={styles.button}>
            {loading ? "…" : "Send"}
          </button>
        </div>

        <div style={styles.hint}>Enter = send • Shift+Enter = new line</div>
      </div>
    </div>
  </div>
);
}

const styles = {
page: {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  background: `
    radial-gradient(1200px 700px at 20% 10%, rgba(140,90,255,0.20), transparent 60%),
    radial-gradient(900px 600px at 80% 20%, rgba(90,160,255,0.18), transparent 60%),
    radial-gradient(1000px 800px at 50% 90%, rgba(255,120,220,0.12), transparent 70%),
    #050509
  `,
},

  // NEW: single-column phone container
container: {
  width: "100%",
  maxWidth: 430,
  margin: "0 auto",   // centers horizontally
  padding: "18px",

  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.08)",

  background: "rgba(15,15,25,0.75)",
  backdropFilter: "blur(12px)",

  boxShadow: `
    0 30px 80px rgba(0,0,0,0.65),
    0 0 60px rgba(120,90,255,0.25)
  `,
},
  shell: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    // IMPORTANT: remove any grid / two-column settings if they exist
    // gridTemplateColumns: undefined,
  },
  header: {
    padding: "8px 4px",
  },
  headerRow: {
  display: "flex",
  alignItems: "flex-start",
paddingTop: "40px",
  justifyContent: "space-between",
},
clearButton: {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "#e9eefc",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 12,
},
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.75,
    fontSize: 13,
  },
  spriteArea: {
  display: "flex",
  justifyContent: "center",
  padding: "10px 0 14px",
},

stage: {
  width: "100%",
  maxWidth: 520,
  height: 360,
  margin: "16px auto 12px",
  borderRadius: 20,
  position: "relative",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "radial-gradient(circle at 50% 35%, rgba(140,90,255,0.20), rgba(0,0,0,0) 60%)",
},

stageGlow: {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 50% 40%, rgba(170,120,255,0.18), rgba(0,0,0,0) 55%)",
  filter: "blur(0px)",
},

sprite: {
  width: "min(46vw, 180px)",
  height: "auto",
  imageRendering: "pixelated", // keeps pixel sprites crisp
  userSelect: "none",
  WebkitUserDrag: "none",
  transformOrigin: "50% 70%",
  // IMPORTANT: we animate via JS interval below, not CSS files
},

spriteIdle: {
  animation: "nebulaFloat 3.8s ease-in-out infinite",
},

spriteThinking: {
  animation: "nebulaFloat 2.6s ease-in-out infinite, nebulaPulse 1.2s ease-in-out infinite",
  filter: "drop-shadow(0 0 14px rgba(170,120,255,0.55))",
},
  chatList: {
    height: "55vh",
    overflowY: "auto",
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  row: {
    display: "flex",
    marginBottom: 10,
  },
  bubble: {
    maxWidth: "78%",
    padding: "10px 12px",
    borderRadius: 14,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    background: "rgba(120, 170, 255, 0.20)",
    border: "1px solid rgba(120, 170, 255, 0.25)",
  },
  nebulaBubble: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  composer: {
    display: "flex",
    gap: 10,
    alignItems: "stretch",
  },
  input: {
    flex: 1,
    resize: "none",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e9eefc",
    outline: "none",
  },
  button: {
    width: 96,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    color: "#e9eefc",
    cursor: "pointer",
  },
  hint: {
    opacity: 0.65,
    fontSize: 12,
    paddingLeft: 4,
  },
};

export default App;