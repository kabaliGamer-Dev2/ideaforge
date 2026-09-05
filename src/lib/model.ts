import type { ModelChoice } from "@/lib/types";

const MODEL_KEY = "ideaforge_model";

export function getModelChoice(): ModelChoice {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = sessionStorage.getItem(MODEL_KEY);
    return stored === "nvidia" || stored === "gemini" ? stored : "auto";
  } catch {
    return "auto";
  }
}