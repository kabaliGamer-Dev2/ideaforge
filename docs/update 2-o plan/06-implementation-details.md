# IdeaForge — Implementation Details (as-built)

**Date** 2026-09-05 · **Status** Blocks 0–5 complete and verified locally · Supabase/mentor (Block 6) and Vercel deploy (Block 7) pending accounts

---

## 1. What is built right now

| Component | File | Status |
|---|---|---|
| Health endpoint | `app/api/health/route.ts` | ✅ verified `llm_configured`/`db_configured` |
| Domain types | `lib/types.ts` | ✅ |
| Sanitise + parse + rank | `lib/sanitize.ts` | ✅ 26/26 assertions |
| Prompt builder + intent classifier | `lib/prompt.ts` | ✅ |
| Deterministic fallback engine | `lib/fallback.ts` | ✅ byte-identical for same input |
| LLM provider (Groq) | `lib/llm.ts` | ✅ live, 15 s timeout, error mapping |
| Generation endpoint (dual-path) | `app/api/generate/route.ts` | ✅ `source: llm` and `source: fallback` both observed |
| UI: form, cards, fit gauge, results | `app/page.tsx`, `components/*`, `app/globals.css` | ✅ engineering-spec-sheet design |
| Verification script | `scripts/check-logic.mjs` | ✅ `node scripts/check-logic.mjs` → 26 passed, 0 failed |

## 2. LLM wiring (Groq)

Provider-agnostic via three env vars — exactly the `LLM_BASE_URL` design from `02-architecture.md` §7.

| Env var | Value | Where |
|---|---|---|
| `LLM_API_KEY` | Groq key | `.env.local` only (gitignored) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | `.env.local` |
| `LLM_MODEL` | `qwen/qwen3.8-27b` | `.env.local` |

`lib/llm.ts` posts to `${LLM_BASE_URL}/chat/completions` with the OpenAI-compatible shape (system + user messages, `temperature 0.6`, `max_completion_tokens 2048`, `top_p 0.95`, `stream: false`). Returns `{ text }` or `{ error }` — **never throws**.

## 3. Dual-path behaviour (proven, not promised)

| Condition | Result | Verified |
|---|---|---|
| Key present, provider healthy | `200`, `source: "llm"` | ✅ live call |
| Key broken / invalid | `200`, `source: "fallback"` in 0.13 s | ✅ deliberate-breakage test |
| Model returns prose around JSON | stage-3 string-aware extractor | ✅ assertion suite |
| Model returns nothing parseable | falls back, logged server-side | ✅ by construction |
| Zero ideas survive sanitisation | regenerate from fallback | ✅ by construction |

The response never 5xx's on a provider failure. That is the acceptance test the panel sees.

## 4. Verification commands (run from repo root)

```bash
node scripts/check-logic.mjs          # 26 assertions, zero deps, ~1 s
npm run dev                           # local dev on :3000
curl -s localhost:3000/api/health     # liveness + config visibility
# generation, expect source: "llm":
curl -s -X POST localhost:3000/api/generate -H "Content-Type: application/json" \
  -d '{"interests":["healthcare"],"skills":["python","react"],"count":3}'
# fallback proof: set LLM_API_KEY=broken in .env.local, restart, re-run the curl above
```

## 5. Design system (engineering spec sheet)

Tokens in `app/globals.css`: `--paper #EDEFE7`, `--ink #16202B`, `--amber #F2B33D`, `--stamp #B23A48`, `--teal #2F6F6B`. Graph-paper grid background (two repeating-linear-gradients at 0.05 opacity). Monospace for structural text, serif for prose. **No border-radius anywhere, no shadows, no gradients on buttons.** Signature element: 12-segment fit gauge (weak 3 · moderate 6 · strong 9 · excellent 12) + band name in monospace caps. The Hallmark skill (`~/.agents/skills/hallmark/`) is installed for a structural-variety audit of this page before the demo.

## 6. Security state (honest)

- `.env.local` gitignored before first commit — verified with `git check-ignore` and a repo-wide key grep (0 hits).
- No credential prefixed `NEXT_PUBLIC_`; browser never sees a key.
- Model text rendered as plain text nodes only — no markdown renderer, no `dangerouslySetInnerHTML`.
- **No auth, no rate limiting** — endpoint is open. Stated, not hidden: first fix after the deadline.

## 7. Next steps (Block 6 + 7)

1. Create Supabase project (browser) → paste `supabase/schema.sql` (below) → copy URL + service role key → fill `.env.local` + Vercel.
2. Build `lib/supabase.ts` (server-only), `app/api/ideas/route.ts`, `app/api/mentor/route.ts`, `components/MentorChat.tsx` — Agent Prompt 5 in `04-build-plan-and-agent-prompts.md`.
3. Deploy to Vercel; run the 5 acceptance tests from `01-product-requirements.md` §7 against the production URL.

## 8. Database schema (paste into Supabase SQL editor — Block 6 starts here)

```sql
create table if not exists public.ideas (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  session_id     text        not null,
  title          text        not null,
  domain         text        not null default 'general',
  summary        text        not null default '',
  why_fits       text        not null default '',
  difficulty     text        not null default 'intermediate',
  duration_weeks integer     not null default 6,
  score          real        not null default 0,
  features       jsonb       not null default '[]'::jsonb,
  stack          jsonb       not null default '[]'::jsonb,
  skills_used    jsonb       not null default '[]'::jsonb,
  roadmap        jsonb       not null default '[]'::jsonb,
  constraint ideas_difficulty_chk
    check (difficulty in ('beginner','intermediate','advanced')),
  constraint ideas_duration_chk
    check (duration_weeks between 1 and 52)
);

create index if not exists ideas_session_idx
  on public.ideas (session_id, created_at desc);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  idea_id    uuid not null references public.ideas(id) on delete cascade,
  session_id text not null,
  role       text not null,
  content    text not null,
  constraint messages_role_chk check (role in ('user','assistant'))
);

create index if not exists messages_thread_idx
  on public.messages (idea_id, created_at asc);

alter table public.ideas    enable row level security;
alter table public.messages enable row level security;
```