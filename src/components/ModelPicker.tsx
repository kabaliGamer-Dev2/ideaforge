import { useState } from "react";
import type { ModelChoice } from "@/lib/types";

const MODEL_KEY = "ideaforge_model";

export default function ModelPicker({ value, onChange }: {
  value: ModelChoice;
  onChange: (m: ModelChoice) => void;
}) {
  const [picked, setPicked] = useState<ModelChoice>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = sessionStorage.getItem(MODEL_KEY);
    return stored === "nvidia" || stored === "gemini" ? stored : "auto";
  });
  const active = value === "auto" ? picked : value;

  function select(m: ModelChoice) {
    setPicked(m);
    try {
      sessionStorage.setItem(MODEL_KEY, m);
    } catch { /* ignore */ }
    onChange(m);
  }

  const options: { id: ModelChoice; label: string; note: string }[] = [
    { id: "auto", label: "Auto", note: "best available provider" },
    { id: "gemini", label: "Gemini", note: "your key or the server's" },
    { id: "nvidia", label: "NVIDIA", note: "nemotron-3-super-120b-a12b" },
  ];

  return (
    <div className="field">
      <label htmlFor="model">AI model</label>
      <select id="model" value={active} onChange={(e) => select(e.target.value as ModelChoice)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label} — {o.note}
          </option>
        ))}
      </select>
    </div>
  );
}