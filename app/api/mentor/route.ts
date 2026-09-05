import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { classifyIntent, buildMentorPrompt } from "@/lib/prompt";
import { callLlm } from "@/lib/llm";
import { mentorFallbackReply } from "@/lib/fallback";
import type { Idea, MentorMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 20;

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

  const b = body as { idea_id?: unknown; session_id?: unknown; message?: unknown; history?: unknown };
  const ideaId = typeof b.idea_id === "string" ? b.idea_id : "";
  const sessionId = typeof b.session_id === "string" ? b.session_id : "";
  const message = typeof b.message === "string" ? b.message.slice(0, 2000).trim() : "";

  if (ideaId.length === 0 || sessionId.length === 0 || message.length === 0) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", message: "idea_id, session_id and message are required.", fields: {} },
      { status: 422 }
    );
  }

  let history: MentorMessage[] = [];
  if (Array.isArray(b.history)) {
    history = b.history
      .filter((h): h is MentorMessage => {
        if (typeof h !== "object" || h === null) return false;
        const m = h as Partial<MentorMessage>;
        return (
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length > 0
        );
      })
      .slice(-MAX_HISTORY);
  }

  let idea: Idea | null = null;
  try {
    const { data, error } = await getSupabase().from("ideas").select("*").eq("id", ideaId).maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "idea_not_found", message: "Save this idea before asking about it." },
        { status: 404 }
      );
    }
    idea = data as Idea;
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Could not reach the idea store." },
      { status: 500 }
    );
  }

  const intent = classifyIntent(message);
  const { system, user } = buildMentorPrompt(idea, message, history, intent);

  let reply: string;
  let source: "llm" | "fallback" = "llm";
  const llmResult = await callLlm(system, user);
  if ("text" in llmResult) {
    reply = llmResult.text;
  } else {
    console.log(`[mentor] llm error ${llmResult.error} — using intent-keyed fallback`);
    source = "fallback";
    reply = mentorFallbackReply(intent, idea);
  }

  try {
    await getSupabase().from("messages").insert([
      { idea_id: ideaId, session_id: sessionId, role: "user", content: message },
      { idea_id: ideaId, session_id: sessionId, role: "assistant", content: reply },
    ]);
  } catch (err) {
    console.log(`[mentor] message persist failed: ${(err as Error).message}`);
  }

  return NextResponse.json({
    ok: true,
    source,
    intent,
    reply,
    message_id: crypto.randomUUID(),
  });
}