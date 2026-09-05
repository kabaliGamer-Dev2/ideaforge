import { VALID_DIFFICULTY, type Difficulty, type FitBand, type Idea } from "../src/lib/types.ts";
import { randomUUID } from "node:crypto";

const MAX_TITLE = 255;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  if (typeof text !== "string") return null;

  // Stage 1: direct parse, accept only a non-null, non-array object.
  try {
    const parsed = JSON.parse(text.trim());
    if (isPlainObject(parsed)) return parsed;
  } catch {
    /* fall through to stage 2 */
  }

  const trimmed = text.trim();

  // Stage 2: code-fenced block.
  if (trimmed.startsWith("```")) {
    const end = trimmed.indexOf("```", 3);
    if (end !== -1) {
      let inner = trimmed.slice(3, end).trim();
      if (inner.startsWith("json")) inner = inner.slice(4).trim();
      try {
        const parsed = JSON.parse(inner);
        if (isPlainObject(parsed)) return parsed;
      } catch {
        /* fall through to stage 3 */
      }
    }
  }

  // Stage 3: first balanced {...} region, string-aware brace-depth scan.
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = trimmed.slice(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (isPlainObject(parsed)) return parsed;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function toStringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" || typeof v === "bigint" ? String(v) : typeof v === "string" ? v.trim() : ""))
      .filter((s) => s.length > 0);
  }
  return [];
}

export function sanitizeIdea(raw: unknown): Idea | null {
  if (!isPlainObject(raw)) return null;

  const titleRaw = raw.title;
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title.length === 0) return null; // discard the whole idea — no sensible default

  let difficulty: Difficulty = "intermediate";
  if (typeof raw.difficulty === "string") {
    const lower = raw.difficulty.toLowerCase();
    if ((VALID_DIFFICULTY as readonly string[]).includes(lower)) {
      difficulty = lower as Difficulty;
    }
  }

  let duration = 6;
  if (typeof raw.duration_weeks === "number" && Number.isFinite(raw.duration_weeks) && raw.duration_weeks > 0) {
    duration = Math.round(raw.duration_weeks);
  } else if (typeof raw.duration_weeks === "string") {
    const n = Number(raw.duration_weeks);
    if (Number.isFinite(n) && n > 0) duration = Math.round(n);
  }

  let score = 0;
  if (typeof raw.score === "number" && Number.isFinite(raw.score)) {
    score = raw.score;
  } else if (typeof raw.score === "string") {
    const n = Number(raw.score);
    if (Number.isFinite(n)) score = n;
  }

  let domain = "general";
  if (typeof raw.domain === "string" && raw.domain.trim().length > 0) {
    domain = raw.domain.trim();
  }

  return {
    id: randomUUID(),
    title: title.slice(0, MAX_TITLE),
    domain,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    why_fits: typeof raw.why_fits === "string" ? raw.why_fits : "",
    difficulty,
    duration_weeks: duration,
    score,
    features: toStringList(raw.features),
    stack: toStringList(raw.stack),
    skills_used: toStringList(raw.skills_used),
    roadmap: toStringList(raw.roadmap),
  };
}

function bandFrom(total: number): FitBand {
  if (total <= 0) return "weak";
  if (total <= 2) return "moderate";
  if (total <= 4) return "strong";
  return "excellent";
}

export function rankIdeas(ideas: Idea[], interests: string[], skills: string[]): Idea[] {
  const interestTerms = interests.map((i) => i.trim().toLowerCase()).filter((i) => i.length > 0);
  const skillTerms = skills.map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0);

  const ranked = ideas.map((idea) => {
    const corpus = [idea.title, idea.domain, idea.summary, idea.why_fits, ...idea.skills_used, ...idea.features]
      .join(" ")
      .toLowerCase();

    const matchedInterests = interestTerms.filter((t) => corpus.includes(t));
    const matchedSkills = skillTerms.filter((t) => corpus.includes(t));

    const score = 0.4 * idea.score + 1.2 * matchedInterests.length + 0.8 * matchedSkills.length;

    return {
      ...idea,
      score,
      fit: {
        matched_interests: matchedInterests,
        matched_skills: matchedSkills,
        band: bandFrom(matchedInterests.length + matchedSkills.length),
      },
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}