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
        <button type="button" className="ghost small" onClick={randomFill}>
          ⤫ Random
        </button>
      </div>
      <div className="chips picker-grid" role="group" aria-label="Skills">
        {SKILL_POOL.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={selected.includes(s)}
            className={`chip${selected.includes(s) ? " match" : ""}`}
            onClick={() => toggle(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}