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