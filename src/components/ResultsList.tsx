import type { ClientIdea } from "@/lib/types";
import IdeaCard from "./IdeaCard";

export default function ResultsList({
  ideas,
  source,
  provider,
  interests,
  skills,
  onSave,
  savedClientId,
  savingId,
}: {
  ideas: ClientIdea[];
  source: "llm" | "fallback";
  provider: string | null;
  interests: string[];
  skills: string[];
  onSave?: (id: string, title: string) => void;
  savedClientId?: string | null;
  savingId?: string | null;
}) {
  if (ideas.length === 0) {
    return <div className="empty-state">No ideas yet — tell us your interests and skills above.</div>;
  }

  return (
    <section style={{ marginTop: 26 }}>
      <div className="tool-label">Step 2 · Ranked ideas</div>
      <div className="meta-strip">
        {ideas.length} idea{ideas.length > 1 ? "s" : ""} ranked for
        {interests.length > 0 ? ` interests [${interests.join(", ")}]` : ""}
        {skills.length > 0 ? ` skills [${skills.join(", ")}]` : ""}
        {source === "llm" && provider ? ` · model: ${provider}` : ""}
      </div>

      {source === "fallback" && (
        <div className="fallback-notice">
          Generated offline from templates. The AI service is unavailable.
        </div>
      )}

      <div className="idea-list">
        {ideas.map((idea, i) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            rank={i + 1}
            featured={i === 0}
            onSave={onSave}
            saved={savedClientId === idea.id}
            saving={savingId === idea.id}
          />
        ))}
      </div>
    </section>
  );
}