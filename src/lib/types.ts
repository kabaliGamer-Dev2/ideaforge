export const VALID_DIFFICULTY = ["low", "beginner", "medium", "high", "advanced"] as const;
export type Difficulty = (typeof VALID_DIFFICULTY)[number];

export type ModelChoice = "auto" | "gemini" | "nvidia" | "zen";

export interface ResearchDossier {
  summary: string;
  market_context: string[];
  existing_solutions: string[];
  gap: string;
  advanced_features: string[];
  validation_plan: string[];
  risks: string[];
}

export interface ProjectFiles {
  "PRD.md": string;
  "BRAIN.md": string;
  "ARCHITECTURE.md": string;
  "PLAN.md": string;
  "PLAN-DAY.md": string;
}

export type FitBand = "weak" | "moderate" | "strong" | "excellent";

export interface Fit {
  matched_interests: string[];
  matched_skills: string[];
  band: FitBand;
}

export interface Idea {
  id: string;
  title: string;
  domain: string;
  summary: string;
  why_fits: string;
  difficulty: Difficulty;
  duration_weeks: number;
  score: number;
  features: string[];
  stack: string[];
  skills_used: string[];
  roadmap: string[];
  fit?: Fit;
}

export interface GenerateInput {
  interests: string[];
  skills: string[];
  difficulty: Difficulty;
  duration_weeks: number;
  count: number;
  notes?: string;
}

/** Idea as delivered to the browser — raw score stripped, fit explained by name. */
export type ClientIdea = Omit<Idea, "score">;

export type MentorIntent = "scope" | "skill_gap" | "stack" | "timeline" | "viva" | "improvements" | "general";

export interface MentorMessage {
  role: "user" | "assistant";
  content: string;
}