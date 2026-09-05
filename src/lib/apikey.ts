"use client";

const KEY = "ideaforge_gemini_key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(value: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = value.trim();
    if (trimmed.length === 0) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, trimmed);
  } catch {
    /* storage unavailable — key simply won't persist */
  }
}