# IdeaForge — Architecture and Data Model

**Stack** Next.js 14+ App Router · TypeScript · React · Supabase Postgres · deployed on Vercel
**Companion docs** `01-product-requirements.md` for the *what*, `03-api-contract.md` for exact payloads

---

## 1. The one decision that shapes everything else

**Both the generation path and the mentor path have a language-model implementation and a deterministic implementation, and the caller cannot tell which one served the request except by reading a flag on the response.**

This is the dual-path design. It exists because a live demo cannot afford a third-party provider on its critical path. Rate limits, expired keys, regional outages, and quota exhaustion all fail at exactly the wrong moment. With a deterministic fallback behind the same interface, a provider failure is a quality degradation rather than an outage.

It buys three things beyond demo safety. You can develop the entire user interface before you have a working model integration, which matters enormously when you have three hours. You can test ranking and rendering deterministically, because the fallback produces identical output for identical input. And you have a genuine architectural decision to defend when someone asks what was interesting about your design.

The cost is real and worth naming: two code paths to maintain, and a fallback whose output is noticeably more generic than the model's. That trade is right here and would be wrong in a product where output quality is the entire value proposition.

---

## 2. Layered view

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│  React client components                                     │
│  · IdeaForm        · ResultsList / IdeaCard                  │
│  · MentorChat      · session id in sessionStorage            │
│  Holds no credentials. Talks only to same-origin /api/*      │
└──────────────────────────┬───────────────────────────────────┘
                           │ fetch, JSON
┌──────────────────────────▼───────────────────────────────────┐
│  VERCEL — Next.js App Router route handlers (server)         │
│  POST /api/generate   POST /api/mentor                       │
│  POST /api/ideas      GET  /api/ideas   GET /api/health      │
│  Validates input · orchestrates · owns all secrets           │
└───────┬───────────────────────────┬──────────────────────────┘
        │                           │
┌───────▼─────────────────┐ ┌───────▼──────────────────────────┐
│  DOMAIN LOGIC           │ │  DATA ACCESS                     │
│  (pure, no framework)   │ │  Supabase client, service role   │
│  · prompt building      │ │  · insert / select ideas         │
│  · JSON extraction      │ │  · insert / select messages      │
│  · sanitisation         │ └───────┬──────────────────────────┘
│  · ranking              │         │
│  · template fallback    │ ┌───────▼──────────────────────────┐
└───────┬─────────────────┘ │  SUPABASE POSTGRES               │
        │                   │  ideas · messages                │
┌───────▼─────────────────┐ │  RLS on, zero policies           │
│  LLM PROVIDER (external)│ └──────────────────────────────────┘
│  OpenAI-compatible HTTP │
│  Optional. Never trusted│
└─────────────────────────┘
```

Two properties of this diagram are load-bearing. The domain logic layer imports nothing from Next.js, Supabase, or React, which is why it can be tested by running a single script with no install step. And the browser never holds a credential of any kind, which is why there is no client-side Supabase client anywhere in the design.

---

## 3. Data flow — generation

```
Student submits form
        │
        ▼
POST /api/generate ── validate ──✗──▶ 422 with field-level message
        │ ✓
        ▼
   Is a model credential configured?
        │                        │
       yes                       no ──────────────┐
        ▼                                         │
   Build prompt, call provider                    │
        │                                         │
   ┌────┴────┐                                    │
   ok      error / timeout ─────────────┐         │
   ▼                                    │         │
Extract JSON (3 stages)                 │         │
   │                                    │         │
 ┌─┴──┐                                 │         │
found  nothing valid ───────────────────┤         │
   ▼                                    ▼         ▼
Sanitise each idea            ┌──────────────────────────┐
Discard the untitled          │  TEMPLATE ENGINE         │
   │                          │  deterministic, offline  │
   │                          └────────────┬─────────────┘
   └───────────────┬───────────────────────┘
                   ▼
              RANK  (0.4·model + 1.2·interest + 0.8·skill)
                   ▼
       200 { ideas, source: "llm" | "fallback", ... }
```

Every path that leaves the provider box arrives at the template engine. That convergence is the whole point: three distinct failure modes, one recovery.

---

## 4. Data flow — mentor

```
Student sends a message about saved idea X
        │
        ▼
POST /api/mentor { idea_id, message, session_id }
        │
        ├──▶ load idea X from Supabase  ──not found──▶ 404
        │
        ├──▶ classify intent from the message text
        │    (scope · skill gap · stack · timeline · viva · general)
        │
        ├──▶ build prompt: idea spec as context + intent + message
        │
        ├──▶ provider available? ── no / fails ──▶ intent-keyed
        │                                          canned guidance
        ▼
   persist user message + assistant reply
        ▼
   200 { reply, source, intent }
```

Intent is classified from the current message, and the current message is *not* appended to the history array before classification. This trips people up: the thing you are answering lives in its own field, and history is history.

---

## 5. Project layout

```
ideaforge/
├── app/
│   ├── layout.tsx                 root layout, fonts, global css
│   ├── page.tsx                   server component shell
│   ├── globals.css                design tokens + all component css
│   └── api/
│       ├── health/route.ts        GET  liveness + config visibility
│       ├── generate/route.ts      POST idea generation
│       ├── mentor/route.ts        POST mentor turn
│       └── ideas/route.ts         POST save, GET list by session
├── components/
│   ├── IdeaForm.tsx               "use client"
│   ├── ResultsList.tsx            "use client"
│   ├── IdeaCard.tsx               "use client"
│   ├── FitGauge.tsx               "use client"  bounded fit display
│   └── MentorChat.tsx             "use client"
├── lib/
│   ├── types.ts                   shared types + VALID_DIFFICULTY
│   ├── sanitize.ts                parseJsonObject, sanitizeIdea, rankIdeas
│   ├── prompt.ts                  prompt construction
│   ├── llm.ts                     provider call, timeout, error mapping
│   ├── fallback.ts                deterministic template engine
│   ├── supabase.ts               server-only client factory
│   └── session.ts                 browser session id helper
├── scripts/
│   └── check-logic.mjs            plain-node assertions over lib logic
├── supabase/
│   └── schema.sql                 paste into the Supabase SQL editor
├── .env.example
├── .env.local                     never committed
├── next.config.js
├── tsconfig.json
└── package.json
```

`lib/sanitize.ts`, `lib/fallback.ts`, and `lib/prompt.ts` must import nothing but `./types`. That constraint is what makes `scripts/check-logic.mjs` runnable with bare `node` and no dependencies — which in turn is what lets you verify your logic in the first hour without waiting on an install.

---

## 6. Database schema

Paste this whole block into the Supabase SQL editor. It is written to be re-runnable.

```sql
-- IdeaForge schema. Safe to re-run.

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

-- Lock both tables. No policies are created, so the anon and
-- authenticated roles can do nothing at all. Only the service role
-- key -- which lives in a server-side env var and is never sent to
-- the browser -- can read or write. This is intentional.
alter table public.ideas    enable row level security;
alter table public.messages enable row level security;
```

### Why RLS is enabled with no policies

There are two ways to run a demo without authentication. Turn RLS off and rely on nobody finding the anon key, or turn RLS on, write no policies, and reach the database only from the server using the service role key. The second is both faster to write and strictly safer, because the service role bypasses RLS by design while the anon key becomes inert. Supabase will stop warning you about an unprotected public table, and there is no client-side database access to secure in the first place.

The consequence to remember: **every database read and write must happen inside a route handler.** If you find yourself importing a Supabase client into a component, something has gone wrong.

### Why list fields are `jsonb` rather than child tables

Features, stack, skills-used, and roadmap are always read and written as complete units. Nothing queries them by element, nothing needs an element to have independent identity, and nothing joins on them. Normalising them would add four join tables and three joins to every read in order to support queries the application never issues. `jsonb` is the honest model of how the data is actually used.

The place this would stop being true is the moment you want "show me every project that uses Postgres" as a feature. If that arrives, normalise `stack` first and leave the other three alone.

---

## 7. Environment variables

| Variable | Where | Purpose | If missing |
|---|---|---|---|
| `SUPABASE_URL` | Vercel + local | Project REST URL | Save and chat fail; generation still works |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | Server-side full access | Save and chat fail; generation still works |
| `LLM_API_KEY` | Vercel + local | Provider credential | Fallback path only — by design |
| `LLM_BASE_URL` | Vercel + local | OpenAI-compatible base URL | Defaults to your chosen provider |
| `LLM_MODEL` | Vercel + local | Model identifier | Defaults to a sensible small model |

Three rules, no exceptions. Nothing above is ever prefixed `NEXT_PUBLIC_`. `.env.local` is in `.gitignore` before the first commit, not after. `.env.example` is committed with empty values so the agent knows what to wire up.

Notice what the "if missing" column means in practice: the application degrades feature by feature rather than failing whole. You can deploy with no Supabase credentials at all and still demonstrate generation and ranking. Keep that property — it is your escape hatch if Supabase setup runs long.

---

## 8. The three algorithms an agent must implement exactly

### 8.1 JSON extraction — three stages, in order

Model output is untrusted input. Treat it the way you would treat a form field from a stranger.

Stage one attempts a direct parse of the trimmed text and accepts the result only if it is a non-array object. Stage two applies when the text begins with a code fence: strip the fence, drop a leading language tag such as `json`, and retry the parse. Stage three scans for the first balanced `{...}` region by tracking brace depth, and it must be string-aware — a brace inside a quoted string does not change depth, and a backslash escapes the next character. Without string-awareness, a perfectly valid `{"a":"}"}` breaks the scanner.

If all three stages fail, return null. Do not attempt repair. A model that returned something unparseable will not be improved by guessing.

### 8.2 Field sanitisation

| Field | Rule |
|---|---|
| `title` | Required non-empty after trim, else **discard the whole idea**. Truncate to 255. |
| `difficulty` | Lowercase. If not in the permitted set, use `intermediate`. |
| `duration_weeks` | Null, zero, or negative becomes 6. |
| `score` | Non-numeric becomes 0. |
| `domain` | Missing or empty becomes `general`. |
| list fields | A string splits on commas; numeric elements coerce to strings; empties drop. |

Discarding is the right response to a missing title and repairing is the right response to everything else. The difference is whether a sensible default exists. There is no sensible default title.

### 8.3 Ranking

Build one lowercase corpus string per idea from title, domain, summary, why-it-fits, skills-used, and features joined together. Count how many of the student's interest terms appear as substrings, and separately how many skill terms. Then:

```
score = 0.4 × model_score + 1.2 × interest_matches + 0.8 × skill_matches
```

Sort descending. Interest outranks skill on the reasoning that motivation determines completion while a skill gap is closable within a semester. The model's own score carries the least weight because it is the one term you cannot verify — it exists to break ties, not to decide the order.

Report matches by name to the interface. A number alone is not an explanation.

---

## 9. Deployment view

```
GitHub repo ──push──▶ Vercel build ──▶ Edge/CDN (static assets)
                            │
                            └────────▶ Serverless functions (/api/*)
                                              │
                                              ├──▶ Supabase Postgres
                                              └──▶ LLM provider
```

Deployment is git-push. There is no container, no reverse proxy, no process manager, and nothing to configure on a server — which is exactly why this stack was chosen over the FastAPI-and-Docker alternative for a three-hour budget. The trade-off you accept in return is a serverless function timeout you do not control and a cold start on the first request after idle. Both are survivable; the timeout is why your provider call needs its own shorter timeout.

---

## 10. What this architecture deliberately does not have

No authentication layer, so there is no user table and no session security to reason about. No caching layer, because generation is inherently non-repeating. No queue or background worker, because every operation completes inside one request. No vector store, because retrieval over past projects is future work rather than MVP. No test framework, because plain-node assertion scripts cover the logic that matters and installing a framework costs minutes you do not have.

Each of those absences is a decision with a reason, which is a different thing from an oversight. If you are asked about any of them, the honest answer is that it was scoped out for the time budget and here is what adding it would cost.

---

*Next: `03-api-contract.md` for exact request and response shapes.*
