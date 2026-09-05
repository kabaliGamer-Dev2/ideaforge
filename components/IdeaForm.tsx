"use client";

import { useState, type FormEvent } from "react";

export interface GenerateRequest {
  interests: string[];
  skills: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  count: number;
}

interface Props {
  onGenerated: (ideas: Idea[], source: "llm" | "fallback", input: { interests: string[]; skills: string[] }) => void;
}

export interface Idea {
  id: string;
  title: string;
  domain: string;
  summary: string;
  why_fits: string;
  difficulty: string;
  duration_weeks: number;
  features: string[];
  stack: string[];
  skills_used: string[];
  roadmap: string[];
  fit?: { matched_interests: string[]; matched_skills: string[]; band: string };
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function IdeaForm({ onGenerated }: Props) {
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [weeks, setWeeks] = useState("12");
  const [count, setCount] = useState("4");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const interestTags = splitTags(interests);
      const skillTags = splitTags(skills);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: interestTags,
          skills: skillTags,
          difficulty,
          duration_weeks: Math.max(1, Math.min(52, Number(weeks) || 12)),
          count: Math.max(1, Math.min(20, Number(count) || 4)),
        } satisfies GenerateRequest),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.message ?? "Something went wrong. Try again.");
        return;
      }
      onGenerated(body.ideas, body.source, { interests: interestTags, skills: skillTags });
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
          <input
            id="interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="healthcare, computer vision"
          />
          <span className="hint">comma-separated</span>
        </div>
        <div className="field">
          <label htmlFor="skills">Skills</label>
          <input
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="python, react, basic ML"
          />
          <span className="hint">comma-separated · at least one field required</span>
        </div>
        <div className="field">
          <label htmlFor="difficulty">Target difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")}
          >
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
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
          <label htmlFor="count">Ideas wanted</label>
          <input
            id="count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate ideas"}
        </button>
        {pending && <span className="pending">working</span>}
      </div>
    </form>
  );
}