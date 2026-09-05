import { useState } from "react";
import type { ClientIdea, ProjectFiles, ResearchDossier } from "@/lib/types";
import { getApiKey } from "@/lib/apikey";
import { getModelChoice } from "@/lib/model";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResearchPanel({ idea, profile }: {
  idea: ClientIdea;
  profile: { interests: string[]; skills: string[]; difficulty: string; duration_weeks: number };
}) {
  const [dossier, setDossier] = useState<ResearchDossier | null>(null);
  const [source, setSource] = useState<"llm" | "fallback">("fallback");
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<ProjectFiles | null>(null);
  const [filesPending, setFilesPending] = useState(false);
  const [error, setError] = useState("");

  async function research() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, ...profile, user_api_key: getApiKey() || undefined, user_model: getModelChoice() }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.message ?? "Research failed. Try again.");
        return;
      }
      setDossier(body.dossier);
      setSource(body.source);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function getFiles() {
    setFilesPending(true);
    setError("");
    try {
      const res = await fetch("/api/project-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, ...profile, research: dossier, user_api_key: getApiKey() || undefined, user_model: getModelChoice() }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.message ?? "Document generation failed.");
        return;
      }
      setFiles(body.files);
      for (const [name, content] of Object.entries(body.files)) {
        download(name.replace(/[^a-zA-Z0-9.-]/g, "_"), String(content));
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setFilesPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="chiprow">
        <button type="button" onClick={research} disabled={pending}>
          {pending ? "Researching…" : dossier ? "Re-run research" : "Research & advance"}
        </button>
        <button type="button" className="ghost" onClick={getFiles} disabled={filesPending || (!dossier && files === null)}>
          {filesPending ? "Generating…" : "Full project files"}
        </button>
      </div>
      {source === "fallback" && dossier && (
        <div className="fallback-notice">Research served offline — the AI service is unavailable.</div>
      )}
      {error && <div className="form-error">{error}</div>}
      {dossier && (
        <div className="dossier">
          <div className="idea-block-label">Research dossier</div>
          <p className="idea-prose">{dossier.summary}</p>
          {dossier.market_context.length > 0 && (
            <div>
              <div className="idea-block-label">Market context</div>
              <ul className="idea-features">{dossier.market_context.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          {dossier.existing_solutions.length > 0 && (
            <div>
              <div className="idea-block-label">Existing solutions</div>
              <ul className="idea-features">{dossier.existing_solutions.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          {dossier.gap && (
            <div>
              <div className="idea-block-label">The gap</div>
              <p className="idea-prose">{dossier.gap}</p>
            </div>
          )}
          {dossier.advanced_features.length > 0 && (
            <div>
              <div className="idea-block-label">Advanced features to add</div>
              <ul className="idea-features">{dossier.advanced_features.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          {dossier.validation_plan.length > 0 && (
            <div>
              <div className="idea-block-label">Validation plan</div>
              <ul className="idea-features">{dossier.validation_plan.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          {dossier.risks.length > 0 && (
            <div>
              <div className="idea-block-label">Risks</div>
              <ul className="idea-features">{dossier.risks.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      {files && (
        <div className="mono files-note">
          Downloaded: PRD.md · BRAIN.md · ARCHITECTURE.md · PLAN.md · PLAN-DAY.md
        </div>
      )}
    </div>
  );
}