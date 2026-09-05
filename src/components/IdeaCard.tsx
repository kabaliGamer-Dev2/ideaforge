import type { ClientIdea } from "@/lib/types";
import FitGauge from "./FitGauge";

export default function IdeaCard({ idea, rank, featured, saved, onSave, saving }: {
  idea: ClientIdea;
  rank: number;
  featured?: boolean;
  saved?: boolean;
  onSave?: (id: string, title: string) => void;
  saving?: boolean;
}) {
  const matches = [
    ...(idea.fit?.matched_interests ?? []).map((t) => ({ t, kind: "interest" })),
    ...(idea.fit?.matched_skills ?? []).map((t) => ({ t, kind: "skill" })),
  ];

  return (
    <article className={`idea${featured ? " featured" : ""}`}>
      {featured && <div className="top-pick">Top pick</div>}
      <div className="idea-meta">
        <span>{idea.domain} · {idea.difficulty} · {idea.duration_weeks} weeks</span>
        <span className="idea-rank">{String(rank).padStart(2, "0")}</span>
      </div>
      <h3 className="idea-title">{idea.title}</h3>
      <p className="idea-prose">{idea.summary}</p>
      {idea.why_fits && (
        <p className="idea-prose">
          <em>Why it fits:</em> {idea.why_fits}
        </p>
      )}

      {idea.fit && (
        <div>
          <div className="idea-block-label">Fit — visible reason, not a number</div>
          <FitGauge band={idea.fit.band} />
          {matches.length > 0 && (
            <div className="chips" style={{ marginTop: 8 }}>
              {matches.map((m) => (
                <span key={m.t} className="chip match">
                  {m.kind === "interest" ? "◎" : "◆"} {m.t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {featured && idea.features.length > 0 && (
        <div>
          <div className="idea-block-label">Features</div>
          <ul className="idea-features">
            {idea.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="idea-block-label">Stack</div>
        <div className="chips">
          {idea.stack.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </div>

      {idea.roadmap.length > 0 && (
        <div>
          <div className="idea-block-label">Roadmap</div>
          <div className="roadmap">
            {idea.roadmap.map((w) => (
              <div key={w} className="week">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {onSave && (
        <button
          type="button"
          className={`btn ${saved ? "btn-success" : "btn-primary"}`}
          onClick={() => onSave(idea.id, idea.title)}
          disabled={saved || saving}
          aria-busy={saving}
          style={{ marginTop: "auto", alignSelf: "flex-start" }}
        >
          {saved ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Saved — mentor ready
            </>
          ) : saving ? (
            "Saving"
          ) : (
            "Save & ask mentor"
          )}
        </button>
      )}
    </article>
  );
}