const PROVIDER_TIMEOUT_MS = 15000;
const RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_BACKOFF_MS = 1500;

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
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

  // Order by user preference; "auto" keeps a sensible default order.
  if (prefer === "nvidia") {
    pool.sort((a, b) => (a.name === "nvidia" ? -1 : b.name === "nvidia" ? 1 : a.name === "gemini" ? -1 : 1));
  } else if (prefer === "gemini") {
    pool.sort((a, b) => (a.name === "gemini" ? -1 : b.name === "gemini" ? 1 : a.name === "nvidia" ? -1 : 1));
  }

  return pool;
}

async function callProvider(p: ProviderConfig, system: string, user: string, maxTokens = 4096): Promise<{ text: string } | { error: string }> {
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const body: Record<string, unknown> = {
        model: p.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_completion_tokens: maxTokens,
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

      if (res.status === 429 && attempt < RATE_LIMIT_RETRIES) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_BACKOFF_MS * (attempt + 1)));
        continue;
      }
      if (!res.ok) return { error: `http_${res.status}` };

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== "string" || text.length === 0) return { error: "empty_response" };
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

  for (const p of available) {
    const result = await callProvider(p, system, user, maxTokens);
    if ("text" in result) return { text: result.text, provider: p.name };
    console.log(`[llm] provider ${p.name} failed: ${result.error} — trying next`);
  }

  return { error: "all_providers_failed" };
}