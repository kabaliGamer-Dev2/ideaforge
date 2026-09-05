import { useState } from "react";
import IdeaForm, { type GenerateResult } from "./components/IdeaForm";
import ResultsList from "./components/ResultsList";
import MentorChat from "./components/MentorChat";
import ApiKeyField from "./components/ApiKeyField";
import { getSessionId } from "./lib/session";

export default function App() {
  const [ideas, setIdeas] = useState<GenerateResult["ideas"]>([]);
  const [source, setSource] = useState<"llm" | "fallback">("fallback");
  const [provider, setProvider] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<GenerateResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  async function onSave(ideaId: string, title: string) {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;
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
      setSavedTitle(title);
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
          Ranked, fully-specified capstone ideas — each with a visible reason for its ranking and a
          week-by-week build order. Save one, then ask the mentor anything.
        </p>
      </header>

      <section className="sec">
        <div className="sec-head">
          <h2>What IdeaForge does</h2>
          <span className="num">01</span>
        </div>
        <p>
          You enter your interests, your existing skills, and how many weeks you have. IdeaForge
          returns a small set of ranked project ideas, each fully specified — problem, features,
          tech stack, difficulty, duration — with the reason for its rank shown by name, plus a
          week-by-week build order you can actually finish.
        </p>
      </section>

      <section className="sec">
        <div className="sec-head">
          <h2>What it is capable of</h2>
          <span className="num">02</span>
        </div>
        <ul>
          <li data-n="01">Explainable ranking — the fit reason names your actual interests and skills, not a number.</li>
          <li data-n="02">Roadmap scaled to your weeks — exactly the time you said you have.</li>
          <li data-n="03">Mentor chat grounded in your saved idea — scope, skills, stack, timeline, improvements, viva prep.</li>
          <li data-n="04">Your own Gemini key, or the built-in provider — it works either way.</li>
          <li data-n="05">Never a dead demo — if the AI is down, the deterministic template engine answers.</li>
          <li data-n="06">Every session feeds an anonymous training dataset for a future fine-tuned model.</li>
        </ul>
      </section>

      <section className="sec">
        <div className="sec-head">
          <h2>Who it is for</h2>
          <span className="num">03</span>
        </div>
        <p>
          Final-year CS/IT students with one semester who need a feasible idea they can defend — and
          the guide or examiner who needs to see the reasoning behind a choice.
        </p>
      </section>

      <ApiKeyField />

      <section style={{ marginTop: 26 }}>
        <div className="tool-label">Step 1 · Your profile</div>
        <IdeaForm
          onGenerated={(result) => {
            setIdeas(result.ideas);
            setSource(result.source);
            setProvider(result.provider);
            setLastInput(result);
            setSavedId(null);
            setSavedClientId(null);
            setSavedTitle("");
          }}
        />
      </section>

      {ideas.length > 0 && lastInput && (
        <ResultsList
          ideas={ideas}
          source={source}
          provider={provider}
          interests={lastInput.interests}
          skills={lastInput.skills}
          profile={{
            interests: lastInput.interests,
            skills: lastInput.skills,
            difficulty: lastInput.difficulty,
            duration_weeks: lastInput.duration_weeks,
          }}
          onSave={onSave}
          savedClientId={savedClientId}
          savingId={saving}
        />
      )}

      {saveError && (
        <div className="form-error" style={{ marginTop: 18 }} role="alert">
          <span aria-hidden="true">▲</span>
          <span>{saveError}</span>
        </div>
      )}

      {savedId !== null && (
        <section style={{ marginTop: 26 }}>
          <div className="tool-label">Step 2 · Ask the mentor</div>
          <MentorChat ideaId={savedId} ideaTitle={savedTitle || "Saved idea"} />
        </section>
      )}

      <footer className="page-footer">
        <span>IdeaForge · dual-path generation — AI on, templates always behind it</span>
        <span>demo build · no auth, no tracking</span>
      </footer>
    </main>
  );
}