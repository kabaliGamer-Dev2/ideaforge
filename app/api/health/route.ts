import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const llmConfigured = typeof process.env.LLM_API_KEY === "string" && process.env.LLM_API_KEY.length > 0;
  const dbConfigured =
    typeof process.env.SUPABASE_URL === "string" && process.env.SUPABASE_URL.length > 0 &&
    typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string" && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 0;

  return NextResponse.json({
    ok: true,
    service: "ideaforge",
    version: "1.0.0",
    time: new Date().toISOString(),
    llm_configured: llmConfigured,
    db_configured: dbConfigured,
  });
}