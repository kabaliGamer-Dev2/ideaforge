export const VALID_DIFFICULTY = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof VALID_DIFFICULTY)[number];

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

export type MentorIntent = "scope" | "skill_gap" | "stack" | "timeline" | "viva" | "improvements" | "general";

export interface MentorMessage {
  role: "user" | "assistant";
  content: string;
}