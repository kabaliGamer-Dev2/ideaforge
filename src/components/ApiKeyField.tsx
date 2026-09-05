import { useState, type FormEvent } from "react";
import { getApiKey, setApiKey } from "@/lib/apikey";

export default function ApiKeyField() {
  const [value, setValue] = useState(getApiKey());
  const [saved, setSaved] = useState(getApiKey().length > 0);

  function onSave(e: FormEvent) {
    e.preventDefault();
    setApiKey(value);
    setSaved(value.trim().length > 0);
  }

  return (
    <form className="sec" onSubmit={onSave}>
      <div className="sec-head">
        <h2>Your own Gemini key</h2>
        <span className="num">04</span>
      </div>
      <p>
        No key? The built-in provider is used automatically. With your key, generation and mentor
        replies run on your Gemini account.
      </p>
      <div style={{ height: 10 }} />
      <div className="keyrow">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="AIza… (Gemini API key, optional)"
          spellCheck={false}
          autoComplete="off"
          aria-label="Gemini API key"
        />
        <button type="submit" className="btn btn-ghost">{saved ? "Update key" : "Use my key"}</button>
        {saved && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setApiKey("");
              setValue("");
              setSaved(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="key-status">
        {saved ? (
          <span>
            <b>Key set — this browser session only.</b> Stored in sessionStorage; sent only to
            IdeaForge and Google.
          </span>
        ) : (
          <span>No key — using the default provider (server).</span>
        )}
      </div>
    </form>
  );
}