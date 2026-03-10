import { useEffect, useMemo, useRef, useState } from "react";
import curious from "./images/curious.png";
import thinking from "./images/cosmic-map.png";
import talking from "./images/radiant.png";
import blink from "./images/nebula_blink.png";
import { supabase } from "./lib/supabaseClient";
import NebulaSprite from "./components/NebulaSprite";
import ufo from "./assets/sprites/ufo.png";

// ✅ Mobile-safe ID helper (crypto.randomUUID can be unavailable on non-HTTPS)
const makeId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function App() {
  // --- Ensure Supabase session (anonymous) on startup ---
  useEffect(() => {
    async function ensureSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log("Error:", error);
        return;
      }

      if (!data.session) {
        const { data: anonData, error: anonErr } =
          await supabase.auth.signInAnonymously();

        console.log("Signed in anonymously:", anonData?.session ? "yes" : "no");
        if (anonErr) console.log("Anon sign-in error:", anonErr);
      }
    }

    ensureSession();
  }, []);

  const [message, setMessage] = useState("");
  const [nebulaState, setNebulaState] = useState("idle");

  const spriteMap = {
    idle: curious,
    thinking: thinking,
    talking: talking,
    blink: blink,
  };

// --- Blink loop ---
const [blinkOn, setBlinkOn] = useState(false);
const [shootingStarData, setShootingStarData] = useState(null);
const [ufoVisible, setUfoVisible] = useState(false);
const [ufoDirection, setUfoDirection] = useState("left");

const [nebulaX, setNebulaX] = useState(0);
const [walkDirection, setWalkDirection] = useState(1);

useEffect(() => {
  const interval = window.setInterval(() => {
    setBlinkOn(true);

    window.setTimeout(() => {
      setBlinkOn(false);
    }, 1000);
  }, 3000);

  return () => {
    window.clearInterval(interval);
  };
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setNebulaX((prev) => {
      let next = prev + walkDirection * 4;

      if (next > 80) {
        setWalkDirection(-1);
        next = 80;
      }

      if (next < -80) {
        setWalkDirection(1);
        next = -80;
      }

      return next;
    });
  }, 120);

  return () => clearInterval(interval);
}, [walkDirection]);

  // --- Bounce ---
  const [bounceOn, setBounceOn] = useState(false);

  const triggerBounce = () => {
    setBounceOn(true);
    window.setTimeout(() => setBounceOn(false), 450);
  };

  // (This sets state temporarily then returns to idle)
  const setTemporaryState = (state, duration = 2000) => {
    setNebulaState(state);
    window.setTimeout(() => setNebulaState("idle"), duration);
  };

  // --- Greetings + messages ---
  const greetings = [
    "Hey… I’m here. 🌙",
    "Welcome back.",
    "Good to see you again.",
    "The stars are quiet tonight.",
    "Hi… what’s on your mind?",
  ];

  const initialGreeting =
    Math.random() < 0.3
      ? greetings[Math.floor(Math.random() * greetings.length)]
      : null;

  const [messages, setMessages] = useState(() => {
    if (!initialGreeting) return [];
    return [
      {
        id: makeId(),
        role: "nebula",
        content: initialGreeting,
        ts: Date.now(),
      },
    ];
  });

  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // ✅ NEW: conversation thread id (server-side)
  const [conversationId, setConversationId] = useState(null);

  // ✅ NEW: Load conversationId from localStorage once on startup
  useEffect(() => {
    try {
      const cid = localStorage.getItem("nebula_conversation_id");
      if (cid) setConversationId(cid);
    } catch {
      // ignore
    }
  }, []);

  // ✅ NEW: Persist conversationId whenever it changes
  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem("nebula_conversation_id", conversationId);
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

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

useEffect(() => {
  const starVariants = [
    {
      key: "downRight",
      top: "8%",
      left: "6%",
    },
    {
      key: "downRight",
      top: "18%",
      left: "14%",
    },
    {
      key: "downLeft",
      top: "10%",
      right: "8%",
    },
    {
      key: "downLeft",
      top: "22%",
      right: "14%",
    },
    {
      key: "upRight",
      bottom: "26%",
      left: "8%",
    },
    {
      key: "upRight",
      bottom: "16%",
      left: "18%",
    },
    {
      key: "upLeft",
      bottom: "24%",
      right: "8%",
    },
    {
      key: "upLeft",
      bottom: "14%",
      right: "18%",
    },
  ];

  const interval = setInterval(() => {
    const chance = Math.random();

    // overall sky event chance
    if (chance < 0.5) {
      const eventRoll = Math.random();

      if (eventRoll < 0.78) {
        // shooting star
        const variant =
          starVariants[Math.floor(Math.random() * starVariants.length)];

        setShootingStarData(variant);

        setTimeout(() => {
          setShootingStarData(null);
        }, 1200);
      } else {
        // UFO event
        const dirRoll = Math.random();
        setUfoDirection(dirRoll < 0.5 ? "left" : "right");

        setUfoVisible(true);

        setTimeout(() => {
          setUfoVisible(false);
        }, 7000);
      }
    }
  }, 4600); // moderate demo timing

  return () => clearInterval(interval);
}, []);

  // ---- MEMORY HELPER ----
  const buildHistoryPayload = (msgs, limit = 12) => {
    return msgs.slice(-limit).map((m) => ({
      role: m.role === "nebula" ? "assistant" : "user",
      content: m.content,
    }));
  };

  // ✅ UPDATED: Clear chat now resets BOTH local messages and the server-side thread id
  const clearChat = () => {
    try {
      localStorage.removeItem("nebula_messages");
      localStorage.removeItem("nebula_conversation_id"); // ✅ NEW
    } catch {
      // ignore
    }

    setConversationId(null); // ✅ NEW: start a fresh conversation thread on next send

    const freshGreeting =
      greetings[Math.floor(Math.random() * greetings.length)];

    setMessages([
      {
        id: makeId(),
        role: "nebula",
        content: freshGreeting,
        ts: Date.now(),
      },
    ]);
  };

  // ✅ sendMessage (threaded)
  const sendMessage = async () => {
    triggerBounce();

    const text = message.trim();
    if (!text || loading) return;

    setNebulaState("thinking");

    // Build history BEFORE pushing the new user message
    const history = buildHistoryPayload(messages, 12);

    // Push user message
    const userMsg = {
      id: makeId(),
      role: "user",
      content: text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Clear input + set loading
    setMessage("");
    setLoading(true);

    try {
      // Get Supabase session token (if available)
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr) console.log("getSession error:", sessionErr);

      const token = sessionData?.session?.access_token;

      // Call backend
      const res = await fetch("https://nebula-backend-ej6e.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: sessionData?.session?.user?.id,
          conversation_id: conversationId, // ✅ persists thread
          message: text,
          history: history,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Backend ${res.status}: ${errText}`);
      }

      const replyData = await res.json();

      // ✅ NEW: store conversation_id so next message continues the same thread
      if (replyData.conversation_id) {
        setConversationId(replyData.conversation_id);
      }

      const replyText = replyData.reply_text || "(no reply)";

      setTemporaryState("talking");

      const nebulaMsg = {
        id: makeId(),
        role: "nebula",
        content: replyText,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, nebulaMsg]);
    } catch (err) {
      console.error("Chat error:", err);

      const nebulaMsg = {
        id: makeId(),
        role: "nebula",
        content:
          "I felt a little cosmic turbulence… but I’m still here. Try again in a moment.",
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, nebulaMsg]);
    } finally {
      setLoading(false);
      setMessage("");
      setNebulaState("idle");
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

        @keyframes sparkleTwinkle {
          0%   { opacity: 0.25; }
          50%  { opacity: 0.9; }
          100% { opacity: 0.25; }
        }

        @keyframes sparkleTwinkleSlow {
          0%   { opacity: 0.18; }
          50%  { opacity: 0.55; }
          100% { opacity: 0.18; }
        }

        @keyframes sparkleTwinkleFast {
          0%   { opacity: 0.22; }
          50%  { opacity: 1; }
          100% { opacity: 0.22; }
        }

        @keyframes mushroomSwayLeft {
          0%   { transform: rotate(-2deg) translateY(0px); }
          50%  { transform: rotate(2deg) translateY(-1px); }
          100% { transform: rotate(-2deg) translateY(0px); }
        }

        @keyframes mushroomSwayRight {
          0%   { transform: rotate(2deg) translateY(0px); }
          50%  { transform: rotate(-2deg) translateY(-1px); }
          100% { transform: rotate(2deg) translateY(0px); }
        }

        @keyframes planetGlowBreath {
          0% {
            opacity: 0.92;
            filter: blur(2px) brightness(0.95);
        }
        50% {
           opacity: 1;
           filter: blur(3px) brightness(1.18);
        }
        100% {
           opacity: 0.92;
           filter: blur(2px) brightness(0.95);
        }
      }

        @keyframes shootingStarDownRight {
          0% {
            opacity: 0;
            transform: translate(0px, 0px) rotate(32deg) scale(0.85);
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(140px, 180px) rotate(32deg) scale(1);
          }
        }

        @keyframes shootingStarDownLeft {
          0% {
            opacity: 0;
            transform: translate(0px, 0px) rotate(-32deg) scale(0.85);
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(-140px, 180px) rotate(-32deg) scale(1);
          }
        }

        @keyframes shootingStarUpRight {
          0% {
            opacity: 0;
            transform: translate(0px, 0px) rotate(-32deg) scale(0.85);
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(140px, -180px) rotate(-32deg) scale(1);
          }
        }

        @keyframes shootingStarUpLeft {
          0% {
            opacity: 0;
            transform: translate(0px, 0px) rotate(32deg) scale(0.85);
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(-140px, -180px) rotate(32deg) scale(1);
          }
        }

                @keyframes ufoDriftRight {
          0% {
            transform: translate(-60px, 0px);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform: translate(420px, 0px);
            opacity: 0;
          }
        }

        @keyframes ufoDriftLeft {
          0% {
            transform: translate(420px, 0px);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform: translate(-60px, 0px);
            opacity: 0;
          }
        }

        @keyframes crystalGlowPulse {
          0%,
          100% {
            opacity: 0.62;
            transform: scaleX(1) scaleY(1);
          }

          50% {
            opacity: 0.88;
            transform: scaleX(1.04) scaleY(1.08);
          }
        }

        @keyframes crystalShardPulse {
          0%,
          100% {
            filter: brightness(1) saturate(1);
          }

          50% {
            filter: brightness(1.16) saturate(1.12);
          }
        }
      `}</style>

      {/* centered single-column container */}
      <div style={styles.container}>
        <div style={styles.shell}>
          <header style={styles.header}>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.title}>Nebula</h1>
                <div style={styles.subtitle}>Mobile • Phase 2: Experience</div>
              </div>

              <button
                onClick={clearChat}
                style={styles.clearButton}
                type="button"
              >
                Clear chat
              </button>
            </div>
          </header>

          {/* STAGE (Phase 2.1) */}
        <div style={styles.stage}>
          <div style={styles.stageGlow} />
          <div style={styles.sparklesBack} />
          <div style={styles.sparklesMid} />
          <div style={styles.sparklesFront} />
          
          {shootingStarData && (
            <div
              style={{
                ...styles.shootingStar,
                ...(shootingStarData.top ? { top: shootingStarData.top } : {}),
                ...(shootingStarData.left ? { left: shootingStarData.left } : {}),
                ...(shootingStarData.right ? { right: shootingStarData.right } : {}),
                ...(shootingStarData.bottom ? { bottom: shootingStarData.bottom } : {}),
                ...(shootingStarData.key === "downRight"
                  ? styles.shootingStarDownRight
                  : {}),
                ...(shootingStarData.key === "downLeft"
                  ? styles.shootingStarDownLeft
                  : {}),
                ...(shootingStarData.key === "upRight"
                  ? styles.shootingStarUpRight
                  : {}),
                ...(shootingStarData.key === "upLeft"
                  ? styles.shootingStarUpLeft
                  : {}),
               }}
             />
           )}

          {ufoVisible && (
            <img
              src={ufo}
              style={{
                ...styles.ufo,
                ...(ufoDirection === "left"
                  ? styles.ufoLeftToRight
                  : styles.ufoRightToLeft)
             }}
            />
          )}
          <div style={styles.planetGround} />

          <div style={styles.mushroomLeft}>
          <div style={styles.mushroomCapPink} />
          <div style={styles.mushroomStemPink} />
       </div>

       <div style={styles.mushroomRight}>
         <div style={styles.mushroomCapBlue} />
         <div style={styles.mushroomStemBlue} />
      </div>

      <div style={styles.crystalFieldGlow} />

      <div style={styles.crystalCluster}>
        <div style={styles.crystalTall} />
        <div style={styles.crystalMid} />
        <div style={styles.crystalSmall} />
        <div style={styles.crystalTiny} />
      </div>

      <NebulaSprite blinkOn={blinkOn} behavior="walk" x={nebulaX} />
    </div>

          <div ref={listRef} style={styles.chatList}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.row,
                  justifyContent:
                    m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.role === "user"
                      ? styles.userBubble
                      : styles.nebulaBubble),
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.row, justifyContent: "flex-start" }}>
                <div
                  style={{
                    ...styles.bubble,
                    ...styles.nebulaBubble,
                    opacity: 0.85,
                  }}
                >
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

            <button
              onClick={sendMessage}
              disabled={!canSend}
              style={styles.button}
            >
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

  container: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
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

  sparklesBack: {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  animation: "sparkleTwinkleSlow 4.6s ease-in-out infinite",
  opacity: 0.45,
  backgroundImage:
    "radial-gradient(1.5px 1.5px at 18% 28%, rgba(255,255,255,0.45), transparent),\
     radial-gradient(1.5px 1.5px at 76% 24%, rgba(180,220,255,0.40), transparent),\
     radial-gradient(1px 1px at 62% 58%, rgba(255,255,255,0.35), transparent),\
     radial-gradient(1px 1px at 28% 68%, rgba(210,190,255,0.35), transparent)",
},

sparklesMid: {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  animation: "sparkleTwinkle 2.8s ease-in-out infinite",
  opacity: 0.75,
  backgroundImage:
    "radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.75), transparent),\
     radial-gradient(2px 2px at 70% 60%, rgba(255,255,255,0.65), transparent),\
     radial-gradient(1.5px 1.5px at 50% 20%, rgba(255,255,255,0.85), transparent),\
     radial-gradient(1.5px 1.5px at 30% 80%, rgba(255,255,255,0.55), transparent)",
},

sparklesFront: {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  animation: "sparkleTwinkleFast 1.9s ease-in-out infinite",
  opacity: 0.9,
  backgroundImage:
    "radial-gradient(2px 2px at 36% 22%, rgba(255,210,255,0.9), transparent),\
     radial-gradient(2px 2px at 64% 34%, rgba(190,230,255,0.9), transparent),\
     radial-gradient(1.5px 1.5px at 24% 52%, rgba(255,255,255,0.85), transparent),\
     radial-gradient(1.5px 1.5px at 78% 72%, rgba(220,200,255,0.8), transparent)",
},

shootingStar: {
  position: "absolute",
  top: "12%",
  left: "12%",
  width: "40px",
  height: "2px",
  borderRadius: "2px",

  background:
    "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.2), transparent)",

  boxShadow: "0 0 8px rgba(255,255,255,0.8)",

  pointerEvents: "none",
  transform: "rotate(32deg)",
  transformOrigin: "left center",

  animation: "shootingStar 1.2s ease-out forwards",
},

ufo: {
  position: "absolute",
  top: "20%",
  width: "36px",
  imageRendering: "pixelated",
  pointerEvents: "none",
  opacity: 0.9,
},

ufoLeftToRight: {
  animation: "ufoDriftRight 7s linear forwards",
},

ufoRightToLeft: {
  animation: "ufoDriftLeft 7s linear forwards",
},

  planetGround: {
  position: "absolute",
  transformOrigin: "center center",
  animation: "planetGlowBreath 7.8s ease-in-out infinite",
  bottom: "-40px",
  width: "120%",
  height: "120px",
  borderRadius: "50%",
  background:
    "radial-gradient(circle at 50% 20%, rgba(120,180,255,0.35), rgba(60,120,255,0.25), rgba(0,0,0,0.9) 80%)",
  filter: "blur(2px)",
},

crystalFieldGlow: {
  position: "absolute",
  bottom: "8px",
  right: "36px",
  width: "90px",
  height: "28px",
  background: "radial-gradient(ellipse at center, rgba(110,255,210,0.28) 0%, rgba(110,255,210,0.12) 40%, rgba(110,255,210,0.05) 60%, transparent 75%)",
  filter: "blur(6px)",
  opacity: 0.75,
  pointerEvents: "none",
  animation: "crystalGlowPulse 7s ease-in-out infinite",
},

mushroomLeft: {
  position: "absolute",
  transformOrigin: "bottom center",
  animation: "mushroomSwayLeft 4.2s ease-in-out infinite",
  bottom: "34px",
  left: "21%",
  width: "24px",
  height: "34px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  pointerEvents: "none",
},

mushroomRight: {
  position: "absolute",
  transformOrigin: "bottom center",
  animation: "mushroomSwayRight 4.8s ease-in-out infinite",
  bottom: "33px",
  right: "19%",
  width: "22px",
  height: "32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  pointerEvents: "none",
},

mushroomCapPink: {
  width: "20px",
  height: "14px",
  borderRadius: "55% 55% 45% 45%",
  background:
    "radial-gradient(circle at 50% 30%, rgba(255,190,235,0.98), rgba(220,110,220,0.9) 58%, rgba(90,45,145,0.92) 100%)",
  boxShadow:
    "0 0 10px rgba(255,170,240,0.65), 0 0 22px rgba(160,90,255,0.35)",
  marginBottom: "-1px",
},

mushroomStemPink: {
  width: "7px",
  height: "16px",
  borderRadius: "5px",
  background:
    "linear-gradient(to bottom, rgba(255,240,250,0.95), rgba(220,205,255,0.78))",
  boxShadow: "0 0 8px rgba(255,220,255,0.22)",
},

mushroomCapBlue: {
  width: "18px",
  height: "13px",
  borderRadius: "55% 55% 45% 45%",
  background:
    "radial-gradient(circle at 50% 30%, rgba(190,240,255,0.98), rgba(100,170,255,0.9) 58%, rgba(45,70,150,0.92) 100%)",
  boxShadow:
    "0 0 10px rgba(140,220,255,0.6), 0 0 20px rgba(90,120,255,0.35)",
  marginBottom: "-1px",
},

mushroomStemBlue: {
  width: "6px",
  height: "15px",
  borderRadius: "5px",
  background:
    "linear-gradient(to bottom, rgba(235,250,255,0.95), rgba(195,220,255,0.78))",
  boxShadow: "0 0 8px rgba(180,220,255,0.20)",
},

crystalCluster: {
  position: "absolute",
  bottom: "14px",
  right: "44px",
  width: "52px",
  height: "52px",
  pointerEvents: "none"
},

crystalTall: {
  position: "absolute",
  bottom: "0",
  left: "16px",
  width: "13px",
  height: "36px",
  background: "linear-gradient(155deg, rgba(230,255,248,0.98) 0%, rgba(90,255,210,0.88) 40%, rgba(30,190,165,0.65) 100%)",
  clipPath: "polygon(50% 0%, 100% 28%, 85% 100%, 15% 100%, 0% 28%)",
  boxShadow: "0 0 12px rgba(80,255,205,0.65), 0 0 22px rgba(80,255,205,0.2)",
  filter: "brightness(1.08)",
  animation: "crystalShardPulse 6.5s ease-in-out infinite",
},

crystalMid: {
  position: "absolute",
  bottom: "0",
  left: "2px",
  width: "10px",
  height: "25px",
  background: "linear-gradient(165deg, rgba(210,255,245,0.93) 0%, rgba(110,245,220,0.78) 48%, rgba(50,195,175,0.5) 100%)",
  clipPath: "polygon(50% 0%, 100% 30%, 82% 100%, 18% 100%, 0% 30%)",
  boxShadow: "0 0 9px rgba(100,245,215,0.55)",
  animation: "crystalShardPulse 6.5s ease-in-out infinite",
},

crystalSmall: {
  position: "absolute",
  bottom: "0",
  left: "31px",
  width: "8px",
  height: "20px",
  background: "linear-gradient(150deg, rgba(220,255,248,0.9) 0%, rgba(130,250,228,0.72) 52%, rgba(60,200,182,0.45) 100%)",
  clipPath: "polygon(50% 0%, 100% 32%, 80% 100%, 20% 100%, 0% 32%)",
  boxShadow: "0 0 7px rgba(110,248,225,0.48)",
  animation: "crystalShardPulse 6.5s ease-in-out infinite",
},

crystalTiny: {
  position: "absolute",
  bottom: "0",
  left: "40px",
  width: "6px",
  height: "13px",
  background: "linear-gradient(160deg, rgba(200,255,245,0.85) 0%, rgba(120,240,218,0.65) 55%, rgba(55,185,168,0.38) 100%)",
  clipPath: "polygon(50% 0%, 100% 30%, 78% 100%, 22% 100%, 0% 30%)",
  boxShadow: "0 0 5px rgba(100,238,218,0.4)",
  animation: "crystalShardPulse 6.5s ease-in-out infinite",
},

  stage: {
    width: "100%",
    maxWidth: 360,
    height: 360,
    margin: "16px auto 12px",
    borderRadius: "50%",
    position: "relative",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 0 60px rgba(150,120,255,0.35)",
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
    imageRendering: "pixelated",
    userSelect: "none",
    WebkitUserDrag: "none",
    transformOrigin: "50% 70%",
  },

  spriteIdle: {
    animation: "nebulaFloat 3.8s ease-in-out infinite",
  },

  spriteThinking: {
    animation:
      "nebulaFloat 2.6s ease-in-out infinite, nebulaPulse 1.2s ease-in-out infinite",
    filter: "drop-shadow(0 0 14px rgba(170,120,255,0.55))",
  },

  spriteBounce: {},

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