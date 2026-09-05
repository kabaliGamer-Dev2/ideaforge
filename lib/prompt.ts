import type { GenerateInput, Idea, MentorIntent, MentorMessage } from "./types.ts";

export function buildGeneratePrompt(input: GenerateInput): { system: string; user: string } {
  const system =
    "You are a final-year project advisor. Reply with a single JSON object only — no prose, no code fence. " +
    'Shape: { "ideas": [ ... ] } where each idea has EXACTLY these keys: ' +
    "title, domain, summary, why_fits, difficulty, duration_weeks, score, features, stack, skills_used, roadmap. " +
    "score is your own 0-10 fit estimate for this student. roadmap entries are strings shaped like " +
    '"Week 1-2: ...". difficulty is one of beginner, intermediate, advanced. ' +
    "Every idea must be feasible for ONE student within the given duration. " +
    "At least one idea must use one of the student's existing skills.";

  const user = [
    `interests: ${input.interests.join(", ") || "(none)"}`,
    `skills: ${input.skills.join(", ") || "(none)"}`,
    `difficulty: ${input.difficulty}`,
    `duration_weeks: ${input.duration_weeks}`,
    `requested idea count: ${input.count}`,
    ...(input.notes ? [`notes: ${input.notes}`] : []),
  ].join("\n");

  return { system, user };
}

export function buildMentorPrompt(
  idea: Idea,
  message: string,
  history: MentorMessage[],
  intent: MentorIntent
): { system: string; user: string } {
  const spec = {
    title: idea.title,
    domain: idea.domain,
    summary: idea.summary,
    difficulty: idea.difficulty,
    duration_weeks: idea.duration_weeks,
    features: idea.features,
    stack: idea.stack,
    skills_used: idea.skills_used,
    roadmap: idea.roadmap,
  };

  const system =
    "You are an expert technical mentor for a final-year capstone project. " +
    "Answer grounded ONLY in the stored project specification provided. " +
    "Do not invent features the spec does not contain. Be specific, direct, and honest. " +
    "The student will defend this project before examiners.";

  const user = [
    `PROJECT SPECIFICATION:`,
    JSON.stringify(spec, null, 2),
    `INTENT: ${intent}`,
    `HISTORY (prior turns):`,
    history.length === 0 ? "(none)" : JSON.stringify(history),
    `CURRENT QUESTION: ${message}`,
  ].join("\n\n");

  return { system, user };
}

const INTENT_KEYWORDS: [MentorIntent, string[]][] = [
  ["viva", ["viva", "defense", "defence", "examiner", "question", "justify", "explain why", "present"]],
  ["timeline", ["week", "timeline", "schedule", "time", "deadline", "finish", "semester", "months"]],
  ["scope", ["scope", "cut", "reduce", "simplify", "too much", "too big", "downsize", "minimal"]],
  ["skill_gap", ["don't know", "do not know", "dont know", "learn", "skill", "new to", "no experience", "never used", "unfamiliar"]],
  ["stack", ["stack", "framework", "library", "database", "frontend", "backend", "api", "tool", "language", "deploy"]],
];

export function classifyIntent(message: string): MentorIntent {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of INTENT_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return intent;
  }
  return "general";
}