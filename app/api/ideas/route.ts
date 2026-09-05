import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sanitizeIdea } from "@/lib/sanitize";
import type { Idea } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const b = body as { session_id?: unknown; idea?: unknown };
  const sessionId = typeof b.session_id === "string" && b.session_id.length > 0 ? b.session_id : "";
  if (sessionId.length === 0) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: "Missing session id.", fields: { session_id: "Required." } },
      { status: 422 }
    );
  }

  const clean = sanitizeIdea(b.idea);
  if (clean === null) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: "Idea is not valid.", fields: { idea: "Required." } },
      { status: 422 }
    );
  }

  const idea = clean as Idea;
  try {
    const { data, error } = await getSupabase()
      .from("ideas")
      .insert({
        session_id: sessionId,
        title: idea.title,
        domain: idea.domain,
        summary: idea.summary,
        why_fits: idea.why_fits,
        difficulty: idea.difficulty,
        duration_weeks: idea.duration_weeks,
        score: idea.score,
        features: idea.features,
        stack: idea.stack,
        skills_used: idea.skills_used,
        roadmap: idea.roadmap,
      })
      .select("id")
      .single();

    if (error) {
      console.log(`[ideas] insert failed: ${error.message}`);
      return NextResponse.json(
        { ok: false, error: "internal_error", message: "Could not save the idea." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.log(`[ideas] supabase error: ${(err as Error).message}`);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Could not save the idea." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") ?? "";
  if (sessionId.length === 0) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: "Missing session id.", fields: { session_id: "Required." } },
      { status: 422 }
    );
  }

  try {
    const { data, error } = await getSupabase()
      .from("ideas")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(`[ideas] list failed: ${error.message}`);
      return NextResponse.json(
        { ok: false, error: "internal_error", message: "Could not load ideas." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, count: data.length, ideas: data });
  } catch (err) {
    console.log(`[ideas] supabase error: ${(err as Error).message}`);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Could not load ideas." },
      { status: 500 }
    );
  }
}