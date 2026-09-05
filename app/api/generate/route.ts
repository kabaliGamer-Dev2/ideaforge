import { NextResponse } from "next/server";
import { VALID_DIFFICULTY, type Difficulty, type GenerateInput } from "@/lib/types";
import { parseJsonObject, sanitizeIdea, rankIdeas } from "@/lib/sanitize";
import { generateFallbackIdeas } from "@/lib/fallback";
import { buildGeneratePrompt } from "@/lib/prompt";
import { callLlm } from "@/lib/llm";

export const dynamic = "force-dynamic";

const MAX_COUNT = 20;
const MAX_DURATION = 52;

function parseGenerateInput(body: unknown): { input: GenerateInput } | { error: { message: string; fields: Record<string, string> } } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: { message: "Request body must be a JSON object.", fields: {} } };
  }
  const b = body as Record<string, unknown>;

  const toList = (v: unknown): string[] =>
    (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter((x) => x.length > 0);

  const interests = toList(b.interests);
  const skills = toList(b.skills);

  if (interests.length === 0 && skills.length === 0) {
    return {
      error: {
        message: "Enter at least one interest or one skill.",
        fields: { interests: "Required if no skills are given." },
      },
    };
  }

  let difficulty: Difficulty = "intermediate";
  if (typeof b.difficulty === "string") {
    const lower = b.difficulty.toLowerCase();
    if ((VALID_DIFFICULTY as readonly string[]).includes(lower)) difficulty = lower as Difficulty;
  }

  let durationWeeks = 12;
  if (typeof b.duration_weeks === "number" && Number.isFinite(b.duration_weeks)) {
    durationWeeks = Math.min(MAX_DURATION, Math.max(1, Math.round(b.duration_weeks)));
  }

  let count = 5;
  if (typeof b.count === "number" && Number.isFinite(b.count)) {
    count = Math.min(MAX_COUNT, Math.max(1, Math.round(b.count)));
  }

  const notes = typeof b.notes === "string" ? b.notes.slice(0, 1000) : undefined;

  return {
    input: {
      interests,
      skills,
      difficulty,
      duration_weeks: durationWeeks,
      count,
      ...(notes !== undefined && notes.length > 0 ? { notes } : {}),
    },
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: "Request body must be valid JSON.", fields: {} },
      { status: 422 }
    );
  }

  const parsed = parseGenerateInput(body);
  if ("error" in parsed) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: parsed.error.message, fields: parsed.error.fields },
      { status: 422 }
    );
  }

  const input = parsed.input;

  // Path A: LLM. Path B: deterministic fallback. Provider failure must never
  // become a 4xx/5xx — it becomes 200 with source: "fallback".
  let source: "llm" | "fallback" = "llm";
  let candidates: unknown[] | null = null;

  const { system, user } = buildGeneratePrompt(input);
  const llmResult = await callLlm(system, user);
  if ("text" in llmResult) {
    const parsedModel = parseJsonObject(llmResult.text);
    const rawIdeas = parsedModel?.ideas;
    if (Array.isArray(rawIdeas) && rawIdeas.length > 0) {
      candidates = rawIdeas;
    } else {
      console.log("[generate] model returned no valid ideas array — falling back");
      source = "fallback";
    }
  } else {
    console.log(`[generate] llm error ${llmResult.error} — falling back`);
    source = "fallback";
  }

  if (candidates === null) {
    candidates = generateFallbackIdeas(input);
    source = "fallback";
  }

  let discardedCount = 0;
  const clean: ReturnType<typeof sanitizeIdea>[] = [];
  for (const idea of candidates) {
    const s = sanitizeIdea(idea);
    if (s) clean.push(s);
    else discardedCount++;
  }
  if (clean.length === 0) {
    console.log("[generate] zero ideas survived sanitisation — re-generating from fallback");
    for (const idea of generateFallbackIdeas(input)) {
      const s = sanitizeIdea(idea);
      if (s) clean.push(s);
    }
    source = "fallback";
  }
  const ranked = rankIdeas(clean as NonNullable<typeof clean[number]>[], input.interests, input.skills);
  const ideas = ranked.map(({ id, title, domain, summary, why_fits, difficulty, duration_weeks, features, stack, skills_used, roadmap, fit }) => ({
    id, title, domain, summary, why_fits, difficulty, duration_weeks, features, stack, skills_used, roadmap, fit,
  }));

  return NextResponse.json({
    ok: true,
    source,
    requested_count: input.count,
    returned_count: ideas.length,
    discarded_count: discardedCount,
    ideas,
  });
}