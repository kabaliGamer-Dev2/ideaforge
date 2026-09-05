"use client";

import { useState, type FormEvent } from "react";
import { getSessionId } from "@/lib/session";

interface Turn {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export default function MentorChat({ ideaId, ideaTitle }: { ideaId: string; ideaTitle: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (message.length === 0 || pending) return;

    const optimistic: Turn = { role: "user", content: message };
    setTurns((t) => [...t, optimistic]);
    setInput("");
    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_id: ideaId,
          session_id: getSessionId(),
          message,
          history: turns
            .filter((t) => !t.error)
            .map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        // roll the optimistic message back
        setTurns((t) => t.filter((x) => x !== optimistic));
        setError(body.message ?? "The mentor could not answer right now.");
        return;
      }
      setTurns((t) => [
        ...t.filter((x) => x !== optimistic),
        { role: "assistant", content: body.reply },
      ]);
    } catch {
      setTurns((t) => t.filter((x) => x !== optimistic));
      setError("Could not reach the mentor. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-label">Mentor chat · {ideaTitle}</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {turns.length === 0 && (
          <div className="empty-state" style={{ padding: "18px 14px", fontSize: 12.5 }}>
            Ask about scope, skills, stack, timeline — or what the examiner will probe.
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className="mono"
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              padding: "10px 12px",
              border: "1px solid var(--line)",
              background: t.role === "user" ? "rgba(242,179,61,0.10)" : "rgba(255,255,255,0.5)",
              borderLeft: t.role === "user" ? "3px solid var(--amber)" : "3px solid var(--teal)",
              color: t.error ? "var(--stamp)" : undefined,
            }}
          >
            <span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(22,32,43,0.5)", marginBottom: 4 }}>
              {t.role === "user" ? "you" : "mentor"}
            </span>
            {t.content}
          </div>
        ))}
      </div>

      <form onSubmit={onSend} style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. I don't know PyTorch yet — can I still finish in 12 weeks?"
          style={{ flex: 1 }}
          disabled={pending}
        />
        <button type="submit" disabled={pending || input.trim().length === 0}>
          {pending ? "Thinking…" : "Ask"}
        </button>
      </form>
      {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}