import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nebula_tasks_v1";

export default function TasksTab() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      return JSON.parse(saved);
    } catch (err) {
      console.error("Failed to load tasks", err);
      return [];
    }
  });

  const [newTask, setNewTask] = useState("");
  const [encouragement, setEncouragement] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Failed to save tasks", err);
    }
  }, [tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const hasCompletedTasks = completedCount > 0;

  function handleAddTask() {
    const trimmed = newTask.trim();
    if (!trimmed) return;

    const task = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask("");
  }

  function handleToggleTask(taskId) {
    let justCompleted = false;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const updated = { ...task, completed: !task.completed };
        if (updated.completed && !task.completed) {
          justCompleted = true;
        }
        return updated;
      })
    );

    if (justCompleted) {
      setEncouragement("Nice work.");
      window.setTimeout(() => {
        setEncouragement("");
      }, 1400);
    }
  }

  function handleDeleteTask(taskId) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }

  function handleClearCompleted() {
    setTasks((prev) => prev.filter((task) => !task.completed));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleAddTask();
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.headerBlock}>
          <h2 style={styles.title}>Tasks</h2>
          <p style={styles.subtitle}>A few things to keep moving today</p>
        </div>

        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
          />
          <button onClick={handleAddTask} style={styles.addButton}>
            Add
          </button>
        </div>

        <div style={styles.utilityRow}>
          <div style={styles.encouragement}>{encouragement || " "}</div>

          {hasCompletedTasks ? (
            <button
              type="button"
              onClick={handleClearCompleted}
              style={styles.secondaryButton}
            >
              Clear completed
            </button>
          ) : null}
        </div>

        <div style={styles.list}>
          {tasks.length === 0 ? (
            <p style={styles.emptyText}>Nothing here yet. Small steps count.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  ...styles.taskRow,
                  ...(task.completed ? styles.taskRowCompleted : {}),
                }}
              >
                <label style={styles.taskMain}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    style={styles.checkbox}
                  />
                  <span
                    style={{
                      ...styles.taskText,
                      ...(task.completed ? styles.taskTextCompleted : {}),
                    }}
                  >
                    {task.text}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  style={styles.deleteButton}
                  aria-label={`Delete task: ${task.text}`}
                  title="Delete task"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          {completedCount} of {tasks.length} complete
        </div>
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
    maxWidth: "520px",
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

  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },

  input: {
    flex: 1,
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    padding: "0 14px",
    fontSize: "1rem",
    outline: "none",
    background: "rgba(255, 255, 255, 0.08)",
    color: "inherit",
    minWidth: 0,
  },

  addButton: {
    minWidth: "82px",
    minHeight: "44px",
    borderRadius: "14px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  utilityRow: {
    minHeight: "28px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  encouragement: {
    minHeight: "24px",
    fontSize: "0.92rem",
    opacity: 0.85,
    flex: 1,
  },

  secondaryButton: {
    flexShrink: 0,
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "0.82rem",
    opacity: 0.9,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "48px",
    padding: "10px 12px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.05)",
  },

  taskRowCompleted: {
    opacity: 0.72,
  },

  taskMain: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
  },

  taskText: {
    fontSize: "1rem",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },

  taskTextCompleted: {
    textDecoration: "line-through",
  },

  deleteButton: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.88)",
    cursor: "pointer",
    fontSize: "1.1rem",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  emptyText: {
    margin: "8px 0",
    opacity: 0.75,
  },

  footer: {
    marginTop: "16px",
    fontSize: "0.92rem",
    opacity: 0.8,
  },
};