import { SKILL_POOL, pickRandom } from "@/lib/pools";

export default function SkillPicker({ selected, onChange }: {
  selected: string[];
  onChange: (skills: string[]) => void;
}) {
  function toggle(skill: string) {
    onChange(selected.includes(skill) ? selected.filter((s) => s !== skill) : [...selected, skill]);
  }

  function randomFill() {
    onChange(pickRandom(SKILL_POOL, 3 + Math.floor(Math.random() * 3)));
  }

  return (
    <div>
      <div className="picker-head">
        <span className="hint">{selected.length} selected · click to toggle</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={randomFill}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 2 4 4-4 4" />
            <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
            <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
            <path d="m18 14 4 4-4 4" />
          </svg>
          Random
        </button>
      </div>
      <div className="chips picker-grid" role="group" aria-label="Skills">
        {SKILL_POOL.map((s) => {
          const on = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              className={`chip${on ? " match" : ""}`}
              onClick={() => toggle(s)}
            >
              {on && <span className="check" aria-hidden="true">✓</span>}
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}