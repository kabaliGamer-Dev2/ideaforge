"use client";

import type { Idea } from "./IdeaForm";
import IdeaCard from "./IdeaCard";

export default function ResultsList({
  ideas,
  source,
  interests,
  skills,
  onSave,
  savedClientId,
  savingId,
}: {
  ideas: Idea[];
  source: "llm" | "fallback";
  interests: string[];
  skills: string[];
  onSave?: (idea: Idea) => void;
  savedClientId?: string | null;
  savingId?: string | null;
}) {
  if (ideas.length === 0) {
    return (
      <div className="empty-state">
        No ideas yet — tell us your interests and skills above.
      </div>
    );
  }

  return (
    <section>
      <div className="card" style={{ borderStyle: "dashed", padding: "14px 18px", marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 12.5 }}>
          {ideas.length} idea{ideas.length > 1 ? "s" : ""} ranked for
          {interests.length > 0 ? ` interests [${interests.join(", ")}]` : ""}
          {skills.length > 0 ? ` skills [${skills.join(", ")}]` : ""}
        </div>
      </div>

      {source === "fallback" && (
        <div className="fallback-notice">
          Generated offline from templates. The AI service is unavailable.
        </div>
      )}

      <div className="idea-grid">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onSave={onSave}
            saved={savedClientId === idea.id}
            saving={savingId === idea.id}
          />
        ))}
      </div>
    </section>
  );
}