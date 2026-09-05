"use client";

const KEY = "ideaforge_session";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = "s_" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}