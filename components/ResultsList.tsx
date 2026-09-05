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
    <section className="bento">
      <div className="meta-strip">
        {ideas.length} idea{ideas.length > 1 ? "s" : ""} ranked for
        {interests.length > 0 ? ` interests [${interests.join(", ")}]` : ""}
        {skills.length > 0 ? ` skills [${skills.join(", ")}]` : ""}
      </div>

      {source === "fallback" && (
        <div className="fallback-notice" style={{ gridColumn: "1 / -1" }}>
          Generated offline from templates. The AI service is unavailable.
        </div>
      )}

      {ideas.map((idea, i) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          rank={i + 1}
          wide={i === 0}
          onSave={onSave}
          saved={savedClientId === idea.id}
          saving={savingId === idea.id}
        />
      ))}
    </section>
  );
}