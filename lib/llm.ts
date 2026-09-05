const PROVIDER_TIMEOUT_MS = 45000;
const RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 10000;
const COOLDOWN_RATE_LIMIT_MS = 60_000; // transient 429 -> skip provider for 1 min
const COOLDOWN_QUOTA_MS = 10 * 60_000; // account exhausted -> skip for 10 min

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxOutput?: number;
}

function providers(userGeminiKey?: string, prefer?: string): ProviderConfig[] {
  const pool: ProviderConfig[] = [];

  const userKey = userGeminiKey?.trim() ?? "";
  if (userKey.length > 0) {
    pool.push({
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: userKey,
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    });
  }

  const groqKey = process.env.LLM_API_KEY ?? "";
  if (groqKey.length > 0) {
    pool.push({
      name: "groq",
      baseUrl: (process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, ""),
      apiKey: groqKey,
      model: process.env.LLM_MODEL ?? "qwen/qwen3.8-27b",
    });
  }

  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  if (geminiKey.length > 0) {
    pool.push({
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    });
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY ?? "";
  if (nvidiaKey.length > 0) {
    pool.push({
      name: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: nvidiaKey,
      model: process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-super-120b-a12b",
    });
  }

  const zenKey = process.env.ZEN_API_KEY ?? "";
  if (zenKey.length > 0) {
    pool.push({
      name: "zen",
      baseUrl: (process.env.ZEN_BASE_URL ?? "https://opencode.ai/zen/v1").replace(/\/$/, ""),
      apiKey: zenKey,
      model: process.env.ZEN_MODEL ?? "mimo-v2.5-free",
      maxOutput: 8192,
    });
  }

  // Order by user preference ("auto" keeps insertion order — groq first, zen last).
  const rank = { zen: 0, gemini: 1, nvidia: 2, groq: 3 };
  const preferred = prefer === "zen" || prefer === "gemini" || prefer === "nvidia" ? prefer : null;
  if (preferred) {
    pool.sort((a, b) => {
      const ar = a.name === preferred ? -1 : rank[a.name] ?? 9;
      const br = b.name === preferred ? -1 : rank[b.name] ?? 9;
      return ar - br;
    });
  }

  return pool;
}

// Bodies that say the account itself is exhausted — retrying can never succeed.
const QUOTA_PATTERNS = /free.?usage.?limit|quota|rate limit exceeded|insufficient balance|credits/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Serialize LLM calls: free-tier keys are rate-limited per minute, and parallel
// clicks (generate + research + files in quick succession) exhaust the window.
let tail: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.catch(() => undefined);
  return run;
}

// Per-provider cooldown memory: a provider that just rate-limited is skipped
// instantly for the rest of its window instead of burning retry backoff.
const cooldownUntil = new Map<string, number>();

function providerOnCooldown(baseUrl: string): boolean {
  const until = cooldownUntil.get(baseUrl);
  if (until === undefined) return false;
  if (Date.now() >= until) {
    cooldownUntil.delete(baseUrl);
    return false;
  }
  return true;
}

async function callProvider(p: ProviderConfig, system: string, user: string, maxTokens = 4096): Promise<{ text: string } | { error: string }> {
  if (providerOnCooldown(p.baseUrl)) return { error: "rate_limited" };
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const tokenLimit = Math.min(maxTokens, p.maxOutput ?? 16384);
      const body: Record<string, unknown> = {
        model: p.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: tokenLimit,
        top_p: 0.95,
        stream: false,
      };
      if (p.name === "nvidia") {
        body.extra_body = { chat_template_kwargs: { enable_thinking: true } };
      }
      const res = await fetch(`${p.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 429 || res.status === 401 || res.status === 403 || (res.status >= 500 && res.status <= 504)) {
        const errBody = await res.text().catch(() => "");
        if (QUOTA_PATTERNS.test(errBody)) {
          // Account-level exhaustion (free usage cap, empty credits) — skip
          // retries, remember it, and let the next provider take over.
          cooldownUntil.set(p.baseUrl, Date.now() + COOLDOWN_QUOTA_MS);
          return { error: res.status === 429 ? "http_429_quota" : "http_unauthorized" };
        }
        if (attempt < RATE_LIMIT_RETRIES && res.status !== 401 && res.status !== 403) {
          const retryAfter = Number(res.headers.get("retry-after"));
          const base = retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_BACKOFF_MS * 2 ** attempt;
          await sleep(Math.min(MAX_BACKOFF_MS, base) + Math.random() * 400);
          continue;
        }
        cooldownUntil.set(p.baseUrl, Date.now() + COOLDOWN_RATE_LIMIT_MS);
        return { error: `http_${res.status}` };
      }
      if (!res.ok) return { error: `http_${res.status}` };

      const data = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
      const msg = data.choices?.[0]?.message;
      let text = typeof msg?.content === "string" && msg.content.length > 0 ? msg.content : "";
      if (!text && typeof msg?.reasoning_content === "string" && msg.reasoning_content.length > 0) {
        text = msg.reasoning_content;
      }
      if (text.length === 0) return { error: "empty_response" };
      return { text };
    } catch (err) {
      if (controller.signal.aborted) return { error: "timeout" };
      return { error: "network" };
    } finally {
      clearTimeout(timer);
    }
  }
  return { error: "http_429" };
}

export type LlmResult = { text: string; provider: string } | { error: string };

export async function callLlm(system: string, user: string, userGeminiKey?: string, prefer?: string, maxTokens = 4096): Promise<LlmResult> {
  const available = providers(userGeminiKey, prefer);
  if (available.length === 0) return { error: "not_configured" };

  return serialized(async () => {
    for (const p of available) {
      const result = await callProvider(p, system, user, maxTokens);
      if ("text" in result) return { text: result.text, provider: p.name };
      console.log(`[llm] provider ${p.name} failed: ${result.error} — trying next`);
    }
    return { error: "all_providers_failed" };
  });
}