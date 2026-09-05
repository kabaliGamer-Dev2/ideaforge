const PROVIDER_TIMEOUT_MS = 15000;

export type LlmResult = { text: string } | { error: string };

export async function callLlm(system: string, user: string): Promise<LlmResult> {
  const apiKey = process.env.LLM_API_KEY;
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    return { error: "not_configured" };
  }

  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "qwen/qwen3.8-27b";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_completion_tokens: 2048,
        top_p: 0.95,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { error: `http_${res.status}` };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.length === 0) {
      return { error: "empty_response" };
    }
    return { text };
  } catch (err) {
    if (controller.signal.aborted) return { error: "timeout" };
    return { error: "network" };
  } finally {
    clearTimeout(timer);
  }
}