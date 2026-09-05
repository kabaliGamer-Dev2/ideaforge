import { useState, type FormEvent } from "react";
import { INTEREST_POOL, pickRandom } from "@/lib/pools";

export default function InterestField({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>(pickRandom(INTEREST_POOL, 6));

  function addTerm(term: string) {
    const current = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!current.includes(term)) {
      current.push(term);
      onChange(current.join(", "));
    }
    setSuggestions(pickRandom(INTEREST_POOL, 6));
  }

  function randomFill() {
    onChange(pickRandom(INTEREST_POOL, 2 + Math.floor(Math.random() * 3)).join(", "));
    setSuggestions(pickRandom(INTEREST_POOL, 6));
  }

  function onEdit(e: FormEvent<HTMLInputElement>) {
    onChange((e.target as HTMLInputElement).value);
  }

  return (
    <div>
      <div className="picker-head">
        <span className="hint">comma-separated · click a suggestion to add</span>
        <button type="button" className="ghost small" onClick={randomFill}>
          ⤫ Random
        </button>
      </div>
      <input
        id="interests"
        value={value}
        onChange={onEdit}
        placeholder="healthcare, computer vision"
        aria-label="Interests"
      />
      <div className="chips picker-suggest" style={{ marginTop: 8 }}>
        {suggestions.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => addTerm(s)}>
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}