import { useEffect, useState } from "react";

const NOTES_STORAGE_KEY = "nebula_calendar_notes_v1";
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2)); // March 2026
  const [selectedDay, setSelectedDay] = useState(null);
  const [notesByDate, setNotesByDate] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesByDate));
    } catch {
      // ignore
    }
  }, [notesByDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function clampDay(day, targetYear, targetMonth) {
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    return Math.min(day, daysInTargetMonth);
  }

  function formatDateKey(inputYear, inputMonth, inputDay) {
    return `${inputYear}-${String(inputMonth + 1).padStart(2, "0")}-${String(
      inputDay
    ).padStart(2, "0")}`;
  }

  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedDateKey =
    selectedDay === null ? null : formatDateKey(year, month, selectedDay);

  const selectedNote = selectedDateKey ? notesByDate[selectedDateKey] || "" : "";

  function goToPreviousMonth() {
    const newMonth = month - 1;
    const newYear = year;

    const adjustedDay =
      selectedDay !== null ? clampDay(selectedDay, newYear, newMonth) : null;

    setCurrentDate(new Date(newYear, newMonth, 1));
    setSelectedDay(adjustedDay);
  }

  function goToNextMonth() {
    const newMonth = month + 1;
    const newYear = year;

    const adjustedDay =
      selectedDay !== null ? clampDay(selectedDay, newYear, newMonth) : null;

    setCurrentDate(new Date(newYear, newMonth, 1));
    setSelectedDay(adjustedDay);
  }

  function handleDayClick(day) {
    setSelectedDay(day);
  }

  function handleClearNote() {
    if (!selectedDateKey) return;

    setNotesByDate((prev) => {
      const next = { ...prev };
      delete next[selectedDateKey];
      return next;
    });
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.headerBlock}>
          <h2 style={styles.title}>Calendar</h2>
          <p style={styles.subtitle}>A gentle place for dates and plans</p>
        </div>

        <div style={styles.monthRow}>
          <button type="button" onClick={goToPreviousMonth} style={styles.navButton}>
            ←
          </button>

          <div style={styles.monthLabel}>
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <button type="button" onClick={goToNextMonth} style={styles.navButton}>
            →
          </button>
        </div>

        <div style={styles.weekdayRow}>
          {weekdayLabels.map((label) => (
            <div key={label} style={styles.weekdayCell}>
              {label}
            </div>
          ))}
        </div>

        <div style={styles.grid}>
          {dayCells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{ ...styles.dayCell, ...styles.dayCellEmpty }}
                />
              );
            }

            const isSelected = day === selectedDay;
            const dateKey = formatDateKey(year, month, day);
            const isToday = dateKey === todayKey;
            const hasNote = Boolean(notesByDate[dateKey]?.trim());

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleDayClick(day)}
                style={{
                  ...styles.dayCell,
                  ...styles.dayCellFilled,
                  ...(isToday ? styles.dayCellToday : {}),
                  ...(isSelected ? styles.dayCellSelected : {}),
                }}
              >
                <span style={styles.dayCellContent}>
                  <span>{day}</span>
                  {hasNote ? <span style={styles.noteDot} /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div style={styles.selectionText}>
          {selectedDay
            ? `Selected: ${currentDate.toLocaleString("default", {
                month: "long",
              })} ${selectedDay}, ${year}`
            : "No day selected yet."}
        </div>

        {selectedDay && (
          <div style={styles.noteBlock}>
            <div style={styles.noteHeaderRow}>
              <label style={styles.noteLabel}>Note</label>
              {selectedNote.trim() ? (
                <button
                  type="button"
                  onClick={handleClearNote}
                  style={styles.clearNoteButton}
                >
                  Clear note
                </button>
              ) : null}
            </div>

            <textarea
              value={selectedNote}
              onChange={(e) => {
                const nextValue = e.target.value;

                setNotesByDate((prev) => ({
                  ...prev,
                  [selectedDateKey]: nextValue,
                }));
              }}
              placeholder="Add a note for this day..."
              rows={4}
              style={styles.noteInput}
            />

            <div style={styles.noteHelperText}>Saved automatically</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "100%",
    borderRadius: "24px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.18)",
    backdropFilter: "blur(10px)",
  },

  headerBlock: {
    marginBottom: "16px",
  },

  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
  },

  subtitle: {
    margin: "6px 0 0 0",
    fontSize: "0.95rem",
    opacity: 0.8,
  },

  monthRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    gap: "12px",
  },

  monthLabel: {
    fontSize: "1rem",
    fontWeight: 600,
    opacity: 0.92,
    textAlign: "center",
    flex: 1,
  },

  navButton: {
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "14px",
  },

  weekdayRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "8px",
    marginBottom: "8px",
  },

  weekdayCell: {
    textAlign: "center",
    fontSize: "0.8rem",
    opacity: 0.7,
    padding: "4px 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "8px",
  },

  dayCell: {
    width: "100%",
    minWidth: 0,
    minHeight: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.92rem",
    boxSizing: "border-box",
    padding: 0,
    position: "relative",
  },

  dayCellFilled: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#fff",
    cursor: "pointer",
    width: "100%",
  },

  dayCellToday: {
    border: "1px solid rgba(255, 230, 160, 0.42)",
    boxShadow: "0 0 0 1px rgba(255, 230, 160, 0.12) inset",
    background: "rgba(255, 230, 160, 0.08)",
  },

  dayCellSelected: {
    background: "rgba(140, 190, 255, 0.18)",
    border: "1px solid rgba(140, 190, 255, 0.32)",
    boxShadow: "0 0 0 1px rgba(140, 190, 255, 0.12) inset",
  },

  dayCellEmpty: {
    background: "transparent",
    border: "1px solid transparent",
  },

  dayCellContent: {
    width: "100%",
    height: "100%",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  noteDot: {
    position: "absolute",
    bottom: "6px",
    right: "7px",
    width: "6px",
    height: "6px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 0 6px rgba(255, 255, 255, 0.35)",
    pointerEvents: "none",
  },

  selectionText: {
    marginTop: "14px",
    fontSize: "0.92rem",
    opacity: 0.82,
  },

  noteBlock: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  noteHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  noteLabel: {
    fontSize: "0.92rem",
    opacity: 0.84,
  },

  clearNoteButton: {
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "0.82rem",
    opacity: 0.9,
  },

  noteInput: {
    width: "100%",
    minHeight: "112px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "10px 12px",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    lineHeight: 1.45,
  },

  noteHelperText: {
    fontSize: "0.78rem",
    opacity: 0.62,
  },
};