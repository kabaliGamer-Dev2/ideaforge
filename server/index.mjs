import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { VALID_DIFFICULTY } from "../src/lib/types.ts";
import { parseJsonObject, sanitizeIdea, rankIdeas } from "../lib/sanitize.ts";
import { generateFallbackIdeas, mentorFallbackReply, fallbackResearch, fallbackProjectFiles } from "../lib/fallback.ts";
import { buildGeneratePrompt, buildMentorPrompt, classifyIntent, buildResearchPrompt, buildProjectFilesPrompt } from "../lib/prompt.ts";
import { callLlm } from "../lib/llm.ts";
import { getSupabase, dbConfigured } from "./supabase.mjs";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT ?? 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env.local loader — values already set in the environment win.
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

// ---------------------------------------------------------------- /api/health
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ideaforge",
    version: "2.0.0",
    time: new Date().toISOString(),
    llm_configured:
      typeof process.env.LLM_API_KEY === "string" && process.env.LLM_API_KEY.length > 0,
    db_configured: dbConfigured(),
  });
});

// ------------------------------------------------------------- /api/generate
const MAX_COUNT = 20;
const MAX_DURATION = 52;

function parseGenerateInput(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: { message: "Request body must be a JSON object.", fields: {} } };
  }
  const toList = (v) =>
    (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter((x) => x.length > 0);

  const interests = toList(body.interests);
  const skills = toList(body.skills);

  if (interests.length === 0 && skills.length === 0) {
    return {
      error: {
        message: "Enter at least one interest or one skill.",
        fields: { interests: "Required if no skills are given." },
      },
    };
  }

  let difficulty = "medium";
  if (typeof body.difficulty === "string") {
    const lower = body.difficulty.toLowerCase();
    const normalized = lower === "intermediate" ? "medium" : lower;
    if (VALID_DIFFICULTY.includes(normalized)) difficulty = normalized;
  }

  let durationWeeks = 12;
  if (typeof body.duration_weeks === "number" && Number.isFinite(body.duration_weeks)) {
    durationWeeks = Math.min(MAX_DURATION, Math.max(1, Math.round(body.duration_weeks)));
  }

  let count = 4;
  if (typeof body.count === "number" && Number.isFinite(body.count)) {
    count = Math.min(MAX_COUNT, Math.max(3, Math.round(body.count)));
  }

  const notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : undefined;

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

app.post("/api/generate", async (req, res) => {
  const parsed = parseGenerateInput(req.body);
  if (parsed.error) {
    return res.status(422).json({ ok: false, error: "validation_failed", ...parsed.error });
  }
  const input = parsed.input;

  const userGeminiKey =
    typeof req.body?.user_api_key === "string" && req.body.user_api_key.trim().length > 0
      ? req.body.user_api_key.trim()
      : undefined;
  const userModel = ["nvidia", "gemini", "auto"].includes(req.body?.user_model) ? req.body.user_model : "auto";

  let source = "llm";
  let provider = null;
  let candidates = null;

  const { system, user } = buildGeneratePrompt(input);
  const llmResult = await callLlm(system, user, userGeminiKey, userModel, 12000);
  if ("text" in llmResult) {
    provider = llmResult.provider;
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
  const clean = [];
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

  const ranked = rankIdeas(clean, input.interests, input.skills);
  const ideas = ranked.map(
    ({ id, title, domain, summary, why_fits, difficulty, duration_weeks, features, stack, skills_used, roadmap, fit }) => ({
      id, title, domain, summary, why_fits, difficulty, duration_weeks, features, stack, skills_used, roadmap, fit,
    })
  );

  // Training dataset: persist the full research record. Fire-and-forget.
  const sessionId = typeof req.body?.session_id === "string" && req.body.session_id.length > 0 ? req.body.session_id : "";
  if (dbConfigured()) {
    try {
      await getSupabase().from("generations").insert({
        session_id: sessionId,
        interests: input.interests,
        skills: input.skills,
        difficulty: input.difficulty,
        duration_weeks: input.duration_weeks,
        count: input.count,
        source,
        provider,
        ideas: ranked.map((r) => ({ ...r, fit: r.fit ?? null })),
        returned_count: ideas.length,
        discarded_count: discardedCount,
      });
    } catch (err) {
      console.log(`[generate] dataset persist skipped: ${err.message}`);
    }
  }

  res.json({
    ok: true,
    source,
    provider,
    requested_count: input.count,
    returned_count: ideas.length,
    discarded_count: discardedCount,
    ideas,
  });
});

// ----------------------------------------------------------------- /api/ideas
app.post("/api/ideas", async (req, res) => {
  const sessionId = typeof req.body?.session_id === "string" && req.body.session_id.length > 0 ? req.body.session_id : "";
  if (sessionId.length === 0) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "Missing session id.", fields: { session_id: "Required." } });
  }

  const clean = sanitizeIdea(req.body?.idea);
  if (clean === null) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "Idea is not valid.", fields: { idea: "Required." } });
  }

  try {
    const { data, error } = await getSupabase()
      .from("ideas")
      .insert({
        session_id: sessionId,
        title: clean.title,
        domain: clean.domain,
        summary: clean.summary,
        why_fits: clean.why_fits,
        difficulty: clean.difficulty,
        duration_weeks: clean.duration_weeks,
        score: clean.score,
        features: clean.features,
        stack: clean.stack,
        skills_used: clean.skills_used,
        roadmap: clean.roadmap,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ ok: true, id: data.id });
  } catch (err) {
    console.log(`[ideas] insert failed: ${err.message}`);
    res.status(500).json({ ok: false, error: "internal_error", message: "Could not save the idea." });
  }
});

app.get("/api/ideas", async (req, res) => {
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (sessionId.length === 0) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "Missing session id.", fields: { session_id: "Required." } });
  }
  try {
    const { data, error } = await getSupabase()
      .from("ideas")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ideas = data.map((row) => {
      const { score: _score, ...rest } = row;
      return rest;
    });
    res.json({ ok: true, count: data.length, ideas });
  } catch (err) {
    console.log(`[ideas] list failed: ${err.message}`);
    res.status(500).json({ ok: false, error: "internal_error", message: "Could not load ideas." });
  }
});

// ----------------------------------------------------------------- /api/mentor
const MAX_HISTORY = 20;

app.post("/api/mentor", async (req, res) => {
  const b = req.body ?? {};
  const ideaId = typeof b.idea_id === "string" ? b.idea_id : "";
  const sessionId = typeof b.session_id === "string" ? b.session_id : "";
  const message = typeof b.message === "string" ? b.message.slice(0, 2000).trim() : "";
  const userGeminiKey =
    typeof b.user_api_key === "string" && b.user_api_key.trim().length > 0 ? b.user_api_key.trim() : undefined;

  if (ideaId.length === 0 || sessionId.length === 0 || message.length === 0) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "idea_id, session_id and message are required.", fields: {} });
  }

  let history = [];
  if (Array.isArray(b.history)) {
    history = b.history
      .filter((h) => {
        if (typeof h !== "object" || h === null) return false;
        return (h.role === "user" || h.role === "assistant") && typeof h.content === "string" && h.content.length > 0;
      })
      .slice(-MAX_HISTORY);
  }

  let idea;
  try {
    const { data, error } = await getSupabase().from("ideas").select("*").eq("id", ideaId).maybeSingle();
    if (error || !data) {
      return res.status(404).json({ ok: false, error: "idea_not_found", message: "Save this idea before asking about it." });
    }
    idea = data;
  } catch (err) {
    console.log(`[mentor] load failed: ${err.message}`);
    return res.status(500).json({ ok: false, error: "internal_error", message: "Could not reach the idea store." });
  }

  const intent = classifyIntent(message);
  const { system, user } = buildMentorPrompt(idea, message, history, intent);

  let reply;
  let source = "llm";
  const llmResult = await callLlm(system, user, userGeminiKey);
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
    console.log(`[mentor] message persist failed: ${err.message}`);
  }

  res.json({ ok: true, source, intent, reply, message_id: randomUUID() });
});

// -------------------------------------------------------------- /api/research
app.post("/api/research", async (req, res) => {
  const b = req.body ?? {};
  const input = parseGenerateInput(b).input ?? {
    interests: [], skills: [], difficulty: "medium", duration_weeks: 12, count: 3,
  };
  const idea = sanitizeIdea(b.idea);
  if (!idea) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "Idea is not valid.", fields: {} });
  }

  const userGeminiKey =
    typeof b.user_api_key === "string" && b.user_api_key.trim().length > 0 ? b.user_api_key.trim() : undefined;
  const userModel = ["nvidia", "gemini", "auto"].includes(b.user_model) ? b.user_model : "auto";

  const { system, user } = buildResearchPrompt(input, idea);
  const llmResult = await callLlm(system, user, userGeminiKey, userModel, 12000);

  let dossier;
  let source = "llm";
  let provider = null;
  if ("text" in llmResult) {
    provider = llmResult.provider;
    const parsed = parseJsonObject(llmResult.text);
    if (parsed && Array.isArray(parsed.summary) === false && typeof parsed.summary === "string") {
      dossier = {
        summary: parsed.summary ?? "",
        market_context: Array.isArray(parsed.market_context) ? parsed.market_context : [],
        existing_solutions: Array.isArray(parsed.existing_solutions) ? parsed.existing_solutions : [],
        gap: typeof parsed.gap === "string" ? parsed.gap : "",
        advanced_features: Array.isArray(parsed.advanced_features) ? parsed.advanced_features : [],
        validation_plan: Array.isArray(parsed.validation_plan) ? parsed.validation_plan : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      };
    } else {
      console.log("[research] model returned unusable dossier — falling back");
      source = "fallback";
    }
  } else {
    console.log(`[research] llm error ${llmResult.error} — falling back`);
    source = "fallback";
  }
  if (!dossier) {
    dossier = fallbackResearch(input, idea);
    source = "fallback";
  }

  res.json({ ok: true, source, provider, dossier });
});

// --------------------------------------------------------- /api/project-files
app.post("/api/project-files", async (req, res) => {
  const b = req.body ?? {};
  const input = parseGenerateInput(b).input ?? {
    interests: [], skills: [], difficulty: "medium", duration_weeks: 12, count: 3,
  };
  const idea = sanitizeIdea(b.idea);
  if (!idea) {
    return res.status(422).json({ ok: false, error: "validation_failed", message: "Idea is not valid.", fields: {} });
  }
  const research = (b.research ?? {}) || {};

  const userGeminiKey =
    typeof b.user_api_key === "string" && b.user_api_key.trim().length > 0 ? b.user_api_key.trim() : undefined;
  const userModel = ["nvidia", "gemini", "auto"].includes(b.user_model) ? b.user_model : "auto";

  const { system, user } = buildProjectFilesPrompt(input, idea, research);
  const llmResult = await callLlm(system, user, userGeminiKey, userModel, 12000);

  let files;
  let source = "llm";
  let provider = null;
  const wanted = ["PRD.md", "BRAIN.md", "ARCHITECTURE.md", "PLAN.md", "PLAN-DAY.md"];
  if ("text" in llmResult) {
    provider = llmResult.provider;
    const parsed = parseJsonObject(llmResult.text);
    const fallbackPack = fallbackProjectFiles(input, idea, research);
    if (parsed) {
      // Merge: accept what the model produced, complete the rest from the fallback pack.
      const merged = {};
      for (const k of wanted) {
        merged[k] = typeof parsed[k] === "string" && parsed[k].length > 100 ? parsed[k] : fallbackPack[k];
      }
      files = merged;
    } else {
      console.log("[files] model returned unusable documents — falling back");
      source = "fallback";
    }
  } else {
    console.log(`[files] llm error ${llmResult.error} — falling back`);
    source = "fallback";
  }
  if (!files) {
    files = fallbackProjectFiles(input, idea, research);
    source = "fallback";
  }

  res.json({ ok: true, source, provider, files });
});

// -------------------------------------------------------- static client build
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(dist, "index.html"), (err) => err && next());
});

app.listen(PORT, () => {
  console.log(`[ideaforge] server on :${PORT} (db:${dbConfigured() ? "on" : "off"})`);
});