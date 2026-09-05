import { useState, type FormEvent } from "react";
import { getSessionId } from "@/lib/session";
import { getApiKey } from "@/lib/apikey";
import type { ClientIdea, Difficulty, ModelChoice } from "@/lib/types";
import SkillPicker from "./SkillPicker";
import InterestField from "./InterestField";
import ModelPicker from "./ModelPicker";

export interface GenerateResult {
  ideas: ClientIdea[];
  source: "llm" | "fallback";
  provider: string | null;
  interests: string[];
  skills: string[];
  difficulty: Difficulty;
  duration_weeks: number;
}

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "low", label: "Low level" },
  { id: "beginner", label: "Beginner level" },
  { id: "medium", label: "Medium level" },
  { id: "high", label: "High level" },
  { id: "advanced", label: "Advanced level" },
];

export default function IdeaForm({ onGenerated }: { onGenerated: (r: GenerateResult) => void }) {
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [weeks, setWeeks] = useState("12");
  const [count, setCount] = useState("4");
  const [model, setModel] = useState<ModelChoice>("auto");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const interestTags = interests
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (interestTags.length === 0 && skills.length === 0) {
      setError("Enter at least one interest or select at least one skill.");
      return;
    }
    if (skills.length === 0) {
      setError("Select at least one skill from the list.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: interestTags,
          skills,
          difficulty,
          duration_weeks: Math.max(1, Math.min(52, Number(weeks) || 12)),
          count: Math.max(3, Math.min(20, Number(count) || 4)),
          session_id: getSessionId(),
          user_api_key: getApiKey() || undefined,
          user_model: model,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.message ?? "Something went wrong. Try again.");
        return;
      }
      onGenerated({
        ideas: body.ideas,
        source: body.source,
        provider: body.provider ?? null,
        interests: interestTags,
        skills,
        difficulty,
        duration_weeks: Math.max(1, Math.min(52, Number(weeks) || 12)),
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="interests">Interests</label>
          <InterestField value={interests} onChange={setInterests} />
        </div>
        <div className="field">
          <label>Skills — select, don't type</label>
          <SkillPicker selected={skills} onChange={setSkills} />
        </div>
        <div className="field">
          <label htmlFor="difficulty">Target difficulty</label>
          <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <ModelPicker value={model} onChange={setModel} />
        <div className="field">
          <label htmlFor="weeks">Weeks available</label>
          <input
            id="weeks"
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="count">Ideas wanted (min 3)</label>
          <input
            id="count"
            type="number"
            min={3}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}
      <div className="form-actions">
        <button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate ideas"}
        </button>
        {pending && <span className="pending">working</span>}
      </div>
    </form>
  );
}