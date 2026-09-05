import type { GenerateInput, Idea, MentorIntent, MentorMessage, ResearchDossier } from "../src/lib/types.ts";

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
    "The student will defend this project before examiners. " +
    "When the student asks how to improve the project, give concrete, practical " +
    "enhancements: what to add for a stronger demo, what an examiner would reward, " +
    "and what is NOT worth the time for this budget.";

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
  ["improvements", ["improve", "improvement", "better", "enhance", "enhancement", "upgrade", "extend", "what next", "next step", "stronger", "impress", "stand out"]],
  ["skill_gap", ["don't know", "do not know", "dont know", "learn", "skill", "new to", "no experience", "never used", "unfamiliar"]],
  ["stack", ["stack", "framework", "library", "database", "frontend", "backend", "api", "tool", "language", "deploy"]],
];

export function buildResearchPrompt(input: GenerateInput, idea: Idea): { system: string; user: string } {
  const system =
    "You are a senior research mentor preparing a final-year student's capstone project for defence. " +
    "Reply with a single JSON object only, no prose, no code fence. " +
    'Shape: { "summary": string, "market_context": string[], "existing_solutions": string[], ' +
    '"gap": string, "advanced_features": string[], "validation_plan": string[], "risks": string[] }. ' +
    "Act as though you researched the domain deeply: name real product categories, real approaches, " +
    "and real risks. Be concrete and specific — never generic filler. " +
    "Each array must have 3-6 items.";

  const user = [
    `PROJECT TITLE: ${idea.title}`,
    `DOMAIN: ${idea.domain}`,
    `SUMMARY: ${idea.summary}`,
    `FEATURES: ${idea.features.join(", ")}`,
    `STACK: ${idea.stack.join(", ")}`,
    `STUDENT SKILLS: ${input.skills.join(", ") || "(none)"}`,
    `DURATION: ${input.duration_weeks} weeks`,
    `TASK: Produce the research dossier that would turn this project from good to advanced — ` +
      "market context, what already exists, the gap this project fills, advanced features worth " +
      "adding, how to validate it, and the risks to watch.",
  ].join("\n");

  return { system, user };
}

export function buildProjectFilesPrompt(input: GenerateInput, idea: Idea, research: ResearchDossier): { system: string; user: string } {
  const system =
    "You are a technical writer producing the complete starter documentation pack for a final-year " +
    "capstone project. Reply with a single JSON object only, no prose, no code fence. " +
    'Shape: { "PRD.md": string, "BRAIN.md": string, "ARCHITECTURE.md": string, "PLAN.md": string, "PLAN-DAY.md": string }. ' +
    "Each value is the FULL markdown content of that file. " +
    "PRD.md: product requirements — problem, users, scope, functional requirements list, non-functional, acceptance criteria, out of scope. " +
    "BRAIN.md: design decisions and trade-offs log — every major choice and why, including what was rejected. " +
    "ARCHITECTURE.md: system design — components, data model, API surface, security notes, deployment. " +
    "PLAN.md: week-by-week build plan with milestones, tests, and checkpoints. " +
    "PLAN-DAY.md: day-by-day task breakdown for each week with concrete daily tasks. " +
    "Write files that a stranger could pick up and start building from. Use markdown headings, lists and tables.";

  const user = [
    `PROJECT TITLE: ${idea.title}`,
    `DOMAIN: ${idea.domain}`,
    `DIFFICULTY: ${idea.difficulty}`,
    `SUMMARY: ${idea.summary}`,
    `FEATURES: ${idea.features.join(", ")}`,
    `STACK: ${idea.stack.join(", ")}`,
    `ROADMAP: ${idea.roadmap.join(" | ")}`,
    `RESEARCH DOSSIER: ${JSON.stringify(research)}`,
    `STUDENT SKILLS: ${input.skills.join(", ") || "(none)"}`,
    `DURATION: ${input.duration_weeks} weeks`,
  ].join("\n");

  return { system, user };
}

export function classifyIntent(message: string): MentorIntent {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of INTENT_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return intent;
  }
  return "general";
}