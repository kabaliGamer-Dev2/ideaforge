import { useState, type FormEvent } from "react";
import { getSessionId } from "@/lib/session";
import { getApiKey } from "@/lib/apikey";

interface Turn {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export default function MentorChat({ ideaId, ideaTitle }: { ideaId: string; ideaTitle: string }) {
  void ideaTitle;
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
          user_api_key: getApiKey() || undefined,
          history: turns
            .filter((t) => !t.error)
            .map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
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
    <div>
      <div style={{ display: "grid", gap: 10 }}>
        {turns.length === 0 && (
          <div className="empty-state">
            Ask about scope, skills, stack, timeline, improvements — or what the examiner will probe.
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`msg${t.role === "user" ? " user" : ""}${t.error ? " error" : ""}`}>
            <span className="who">{t.role === "user" ? "you" : "mentor"}</span>
            {t.content}
          </div>
        ))}
      </div>

      <form onSubmit={onSend} className="chat-form" style={{ marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. I don\u2019t know PyTorch yet \u2014 can I still finish in 12 weeks?"
          disabled={pending}
          aria-label="Ask the mentor"
        />
        <button type="submit" className="btn btn-primary" disabled={pending || input.trim().length === 0} aria-busy={pending}>
          {pending ? "Thinking" : "Ask"}
        </button>
      </form>
      {error && (
        <div className="form-error" style={{ marginTop: 12 }} role="alert">
          <span aria-hidden="true">▲</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}