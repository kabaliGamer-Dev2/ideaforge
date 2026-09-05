"use client";

import { useState } from "react";
import IdeaForm, { type Idea } from "@/components/IdeaForm";
import ResultsList from "@/components/ResultsList";
import MentorChat from "@/components/MentorChat";
import { getSessionId } from "@/lib/session";

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [source, setSource] = useState<"llm" | "fallback">("fallback");
  const [lastInput, setLastInput] = useState<{ interests: string[]; skills: string[] }>({ interests: [], skills: [] });
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  async function onSave(idea: Idea) {
    setSaving(idea.id);
    setSaveError("");
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSessionId(), idea }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setSaveError(body.message ?? "Could not save the idea.");
        return;
      }
      setSavedId(body.id);
      setSavedClientId(idea.id);
      setSavedTitle(idea.title);
    } catch {
      setSaveError("Could not reach the server. Try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="wrap">
      <header className="page-header">
        <div className="kicker">IdeaForge · capstone project advisor</div>
        <h1>Tell us what you know. Get a project you can finish.</h1>
        <p className="lead">
          Ranked, fully-specified project ideas — each with a visible reason for its ranking and a
          week-by-week build order. Save one, then ask the mentor anything.
        </p>
      </header>

      <section className="bento">
        <div className="cell span-wide">
          <div className="cell-label">Step 1 · Your profile</div>
          <IdeaForm
            onGenerated={(newIdeas, newSource, input) => {
              setIdeas(newIdeas);
              setSource(newSource);
              setLastInput(input);
              setSavedId(null);
              setSavedClientId(null);
              setSavedTitle("");
            }}
          />
        </div>

        {ideas.length > 0 && (
          <ResultsList
            ideas={ideas}
            source={source}
            interests={lastInput.interests}
            skills={lastInput.skills}
            onSave={onSave}
            savedClientId={savedClientId}
            savingId={saving}
          />
        )}

        {saveError && <div className="form-error" style={{ gridColumn: "1 / -1" }}>{saveError}</div>}

        {savedId !== null && (
          <MentorChat ideaId={savedId} ideaTitle={savedTitle || "Saved idea"} />
        )}
      </section>

      <footer className="page-footer">
        <span>IdeaForge · dual-path generation — AI on, templates always behind it</span>
        <span>demo build · no auth, no tracking</span>
      </footer>
    </main>
  );
}