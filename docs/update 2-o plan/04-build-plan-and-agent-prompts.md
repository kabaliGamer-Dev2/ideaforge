# IdeaForge — 3-Hour Build Plan and Agent Prompts

**Budget** 180 minutes, start to public URL. **Builder** you, driving AI coding agents.
**Read `03-api-contract.md` before starting.** The prompts below reference it.

---

## Part A — Five rules that decide whether you finish

**Deploy in the first twenty minutes.** Push an untouched Next.js starter to Vercel before you write a single line of your own code. The deployment pipeline is the one thing in this build that can fail for reasons you cannot debug quickly — a wrong root directory, a build-command mismatch, an env var that needs a redeploy to take effect. Discover that at minute 15 when it costs five minutes, not at minute 165 when it costs you the project. This single rule matters more than the other four combined.

**Build the fallback before the AI.** Counter-intuitive and correct. The deterministic template engine gives you a complete, demonstrable product by roughly the halfway mark. After that, every minute spent on the model path adds quality to something that already works, instead of adding risk to something that does not exist yet.

**One prompt, one file group.** "Build me the app" produces a large volume of code you cannot review, with errors distributed unpredictably through it. Five scoped prompts, each ending in a command you can run, means every failure is localised to about twenty minutes of work. Scope is what makes agent output reviewable.

**Every prompt ends in a verification command.** If you cannot state the command that proves a phase worked, you have not finished specifying the phase. `node scripts/check-logic.mjs`, `curl localhost:3000/api/health`, "the form submits and cards render" — the command is part of the deliverable.

**Two strikes and you take the file.** If an agent produces broken output twice on the same file, stop re-prompting and write it yourself. The third attempt almost never works, and you will have spent fifteen minutes discovering that. Re-prompting has a real success rate on the first retry and a poor one after.

---

## Part B — The timeline

Times are minutes from start. Checkpoints are gates: if you have not passed one, do not proceed to the next block — go to the cut list instead.

### Block 0 · T+0 → T+15 · Start the slow things first

| T | Action |
|---|---|
| 0 | Create the Supabase project in a browser tab. Choose the region nearest you. Provisioning takes a couple of minutes — **do not sit and watch it.** Leave the tab. |
| 2 | Locally: scaffold Next.js with TypeScript, App Router, no Tailwind, no ESLint strictness. Accept every default that gets you to a running dev server. |
| 7 | `git init`, commit, create an empty GitHub repo, push. Confirm `.gitignore` already contains `.env*.local` before the first commit. |
| 11 | Import the repo into Vercel. Framework detection should say Next.js. Change nothing else. Deploy. |
| 15 | **Checkpoint A — a public Vercel URL loads the stock Next.js page.** |

If Checkpoint A fails, everything else waits. This is the only block with no cut option.

### Block 1 · T+15 → T+30 · Plumbing and the health endpoint

| T | Action |
|---|---|
| 15 | Supabase → SQL Editor → paste the whole schema block from `02-architecture.md` §6 → Run. Confirm both tables appear under Table Editor. |
| 20 | Supabase → Project Settings → API. Copy the project URL and the **service role** key. Not the anon key. |
| 22 | Add all five env vars to Vercel for Production, Preview, and Development. Mirror them into `.env.local`. |
| 25 | Run **Agent Prompt 0**. Push. |
| 28 | Hit `/api/health` on the live Vercel URL. |
| 30 | **Checkpoint B — `llm_configured` and `db_configured` both `true` in production.** |

Vercel env vars added after a deployment do not apply to it. If your flags read false, redeploy before you debug anything else.

### Block 2 · T+30 → T+60 · Domain logic, actually verified

| T | Action |
|---|---|
| 30 | Run **Agent Prompt 1**. |
| 50 | `node scripts/check-logic.mjs` |
| 55 | Fix failures. Read them carefully — a failing assertion here is worth ten minutes because it is a bug you would otherwise find during the demo. |
| 60 | **Checkpoint C — every assertion passes.** |

This block earns its thirty minutes. Sanitisation and ranking are where the subtle bugs live, and this is the only place in the build where you get to verify them with zero setup cost.

### Block 3 · T+60 → T+80 · Generation endpoint, fallback only

| T | Action |
|---|---|
| 60 | Run **Agent Prompt 2**. |
| 75 | `curl` the endpoint locally with a real payload. Confirm `source: "fallback"` and ranked ideas. |
| 80 | **Checkpoint D — ranked ideas over real HTTP.** |

### Block 4 · T+80 → T+110 · The interface

| T | Action |
|---|---|
| 80 | Run **Agent Prompt 3**. |
| 103 | Submit the form in the browser. Cards render with fit bands and named matches. |
| 106 | Commit, push, confirm the production deploy. |
| 110 | **Checkpoint E — a complete working product at a public URL, with no AI in it.** |

Checkpoint E is the important one psychologically. From here you cannot end up with nothing. Everything after is upside.

### Block 5 · T+110 → T+130 · The model path

| T | Action |
|---|---|
| 110 | Run **Agent Prompt 4**. |
| 122 | Test with the key present — expect `source: "llm"`. |
| 126 | Temporarily break the key in `.env.local`, restart dev, submit again — expect `source: "fallback"` and a clean 200. Restore the key. |
| 130 | **Checkpoint F — both source values observed, no 500 in either case.** |

That deliberate-breakage test is your strongest demo moment. Do not skip it just because it feels like it should work.

### Block 6 · T+130 → T+155 · Persistence and mentoring

| T | Action |
|---|---|
| 130 | Run **Agent Prompt 5**. |
| 150 | Save an idea, reload, confirm it is still there, ask it a question, get a reply. |
| 155 | **Checkpoint G — save and chat both work.** |

### Block 7 · T+155 → T+172 · Ship and verify in production

Push. Wait for the deploy to finish — actually wait, do not assume. Then run all five acceptance tests from `01-product-requirements.md` §7 **against the production URL, not localhost.** Local success proves nothing about production; env vars, timeouts, and cold starts all differ.

Fix only what blocks an acceptance test. Nothing else. At T+172 you stop editing code regardless of what you were in the middle of.

### Block 8 · T+172 → T+180 · The run sheet

Write six lines you will actually say and do, in order, and read them once. The demo you have rehearsed once beats the demo you know you could give.

```
1. Open the URL. "This is live on Vercel."
2. Enter my real interests and skills. Submit.
3. Point at the fit line. "It tells you WHY, by name."
4. Open a card. Features, stack, week-by-week roadmap.
5. Save it. Ask the mentor one prepared question.
6. "One more thing —" flip to the fallback build. "The AI is off. It still works."
```

Point 6 is the one people remember. Have the fallback demonstrable — a second browser tab against a preview deployment with a broken key is the cheapest way to do this.

---

## Part C — The cut list

Read down the list and cut in this order. Cut early rather than heroically: a finished small product demos better than an unfinished large one.

| If you are behind at | Cut | Cost of cutting |
|---|---|---|
| Checkpoint C (T+60) | The check script's optional assertions; keep the sanitisation ones | Slightly less confidence in ranking |
| Checkpoint D (T+80) | `notes` field handling; `discarded_count` in the response | Nothing visible |
| Checkpoint E (T+110) | The fit gauge visual; ship a plain text fit line | Looks plainer, says the same thing |
| Checkpoint F (T+130) | **Ship on fallback only.** Say the LLM path is designed and wired but unconfigured. | Real, but you still have a working product and an honest story |
| Checkpoint G (T+155) | Mentor chat entirely; keep save | Halves the pitch, does not break it |
| T+165 | Save as well. Ship stateless. | Supabase becomes future work; the ranking demo is intact |

The two things you never cut: the deployment, and the visible fit explanation. Everything else is negotiable.

---

## Part D — The agent prompts

Copy these verbatim. Paste the referenced section of `03-api-contract.md` along with the prompt where it says to. Run them in order.

### Agent Prompt 0 — health endpoint

````
Create ONE file: app/api/health/route.ts

A Next.js App Router GET route handler returning JSON:
{ ok, service, version, time, llm_configured, db_configured }

- service: "ideaforge", version: "1.0.0", time: new Date().toISOString()
- llm_configured: true only if process.env.LLM_API_KEY is a non-empty string
- db_configured: true only if BOTH process.env.SUPABASE_URL and
  process.env.SUPABASE_SERVICE_ROLE_KEY are non-empty strings

Hard constraints:
- Never include any part of a key's value, prefix, or length in the response.
- No new dependencies.
- Add `export const dynamic = "force-dynamic"` so it is not statically cached.

Then tell me the exact curl command to verify it.
````

### Agent Prompt 1 — domain logic and its verification script

This is the highest-value prompt in the build. Do not compress it.

````
Create FIVE files. No dependencies. TypeScript. lib/*.ts must import ONLY
from ./types — no Next.js, no React, no Supabase, no npm packages.

--- lib/types.ts
export const VALID_DIFFICULTY = ["beginner","intermediate","advanced"] as const;
export type Difficulty = typeof VALID_DIFFICULTY[number];
export type FitBand = "weak" | "moderate" | "strong" | "excellent";

export interface Idea {
  id: string; title: string; domain: string; summary: string;
  why_fits: string; difficulty: Difficulty; duration_weeks: number;
  score: number; features: string[]; stack: string[];
  skills_used: string[]; roadmap: string[];
  fit?: { matched_interests: string[]; matched_skills: string[]; band: FitBand };
}
export interface GenerateInput {
  interests: string[]; skills: string[]; difficulty: Difficulty;
  duration_weeks: number; count: number; notes?: string;
}

--- lib/sanitize.ts  — three exports

1) parseJsonObject(text: string): Record<string, unknown> | null
   THREE STAGES, IN ORDER. Do not merge them.
   Stage 1: JSON.parse(text.trim()); accept only a non-null, non-array object.
   Stage 2: if the trimmed text starts with ``` , cut to the next ``` , drop a
            leading "json" language tag, retry the parse.
   Stage 3: scan from the first "{" tracking brace depth, and BE STRING-AWARE:
            a backslash escapes the next char; an unescaped " toggles in-string;
            braces inside a string do NOT change depth. Return the first
            balanced region parsed. This must handle the input {"a":"}"}.
   All three fail -> return null. NEVER attempt to repair malformed JSON.

2) sanitizeIdea(raw: unknown): Idea | null
   - title: trim; if empty or absent -> return null (DISCARD the idea, do not
     substitute a default). Otherwise truncate to 255 chars.
   - difficulty: lowercase; if not in VALID_DIFFICULTY -> "intermediate".
   - duration_weeks: if null/undefined/non-numeric/<=0 -> 6; else Math.round.
   - score: non-numeric -> 0.
   - domain: missing or empty after trim -> "general".
   - features, stack, skills_used, roadmap: if the value is a string, split on
     commas; coerce numeric elements to strings; trim; drop empties; if the
     value is neither string nor array -> [].
   - id: crypto.randomUUID()

3) rankIdeas(ideas: Idea[], interests: string[], skills: string[]): Idea[]
   For each idea build ONE lowercase corpus string by joining title, domain,
   summary, why_fits, skills_used and features with spaces.
   matched_interests = interest terms (lowercased, trimmed, non-empty) that
   appear as a substring of the corpus. matched_skills likewise.
   score = 0.4 * idea.score + 1.2 * matched_interests.length
                            + 0.8 * matched_skills.length
   Attach fit = { matched_interests, matched_skills, band } where band is
   derived from matched_interests.length + matched_skills.length:
   0 -> "weak", 1-2 -> "moderate", 3-4 -> "strong", 5+ -> "excellent".
   Return a NEW array sorted by score descending. Do not mutate the input.

--- lib/prompt.ts
buildGeneratePrompt(input: GenerateInput): { system: string; user: string }
The system message must instruct: reply with a single JSON object only, no
prose, no code fence, shape { "ideas": [ ... ] }, each idea having the exact
keys title, domain, summary, why_fits, difficulty, duration_weeks, score,
features, stack, skills_used, roadmap. score is the model's own 0-10 fit
estimate. roadmap entries are strings shaped like "Week 1-2: ...".
Also export buildMentorPrompt(idea, message, history, intent) and
classifyIntent(message) returning one of:
"scope" | "skill_gap" | "stack" | "timeline" | "viva" | "general"
(keyword matching is fine — it is the fallback key, not the product).

--- lib/fallback.ts
generateFallbackIdeas(input: GenerateInput): Idea[]
Fully deterministic — same input must always give byte-identical output.
Keep an internal array of at least 10 domain templates (health, education,
agriculture, finance, logistics, sustainability, accessibility, civic data,
retail, campus operations). Select templates whose domain or keywords overlap
the input interests, falling back to the first N when nothing overlaps.
Fill each template's title/summary/why_fits with the student's actual interest
and skill terms so the output looks tailored, not canned. Scale the roadmap to
input.duration_weeks. Set score to a fixed small constant. Return exactly
min(count, available) ideas. NO randomness, NO Date.now(), NO Math.random().
Also export mentorFallbackReply(intent, idea): string with distinct, genuinely
useful guidance per intent.

--- scripts/check-logic.mjs
Plain node ESM, run with bare `node scripts/check-logic.mjs`, zero deps.
Import the lib modules (compile the TS to .mjs first if needed and tell me
that command). Use node:assert. Print a PASS/FAIL line per assertion and a
final tally. Cover AT MINIMUM:
- parseJsonObject: clean object; fenced with json tag; fenced without tag;
  prose before and after the object; the {"a":"}"} string-brace case;
  a top-level array (must be null); unbalanced braces (null); empty (null).
- sanitizeIdea: missing title -> null; whitespace-only title -> null;
  "ADVANCED" -> "advanced"; "expert" -> "intermediate"; weeks 0 -> 6;
  weeks -3 -> 6; weeks null -> 6; score "abc" -> 0; missing domain ->
  "general"; features "a, b, c" -> ["a","b","c"]; features [1,2] ->
  ["1","2"]; a 300-char title truncated to 255.
- rankIdeas: an idea matching two interests outranks one matching two skills
  (proves the 1.2 vs 0.8 weighting); band thresholds; input not mutated.
- generateFallbackIdeas: same input twice -> deep-equal output; respects count;
  roadmap length scales with duration_weeks.

Do NOT write any React, any route handler, or any Supabase code in this step.
When done, give me the exact command to run the checks.
````

### Agent Prompt 2 — generation endpoint, fallback only

````
Create ONE file: app/api/generate/route.ts

Implement POST exactly to this contract:
[PASTE §2 of 03-api-contract.md HERE]

For this step, ALWAYS use generateFallbackIdeas from lib/fallback.ts and
always set source: "fallback". Do not call any external service yet.

Order of operations:
1. Parse the body inside try/catch; unparseable body -> 422.
2. Validate: interests and skills both empty -> 422 with the exact message
   "Enter at least one interest or one skill." and a fields object.
   Clamp count to 1..20 (default 5) and duration_weeks to 1..52 (default 12).
   Normalise difficulty via the same rule as sanitizeIdea.
   Trim list entries and drop empties.
3. Generate, then map every idea through sanitizeIdea, counting discards.
4. rankIdeas with the student's interests and skills.
5. Return 200 with ok, source, requested_count, returned_count,
   discarded_count, ideas.

Constraints:
- Strip `score` from each idea before responding. The response exposes
  fit.band only, never the raw number.
- No new dependencies. `export const dynamic = "force-dynamic"`.
- No try/catch that swallows an error silently — log the cause server-side.

Give me a curl command with a realistic body to verify it.
````

### Agent Prompt 3 — the interface

````
Build the UI. Files: app/page.tsx, app/globals.css, and components
IdeaForm.tsx, ResultsList.tsx, IdeaCard.tsx, FitGauge.tsx.
All components are client components ("use client"). app/page.tsx is a server
component that renders the form.

DESIGN DIRECTION — "engineering spec sheet". Follow it exactly; do not
substitute your own palette.
  --paper: #EDEFE7   page ground
  --ink:   #16202B   primary text
  --amber: #F2B33D   primary accent, interactive
  --stamp: #B23A48   warnings, the fallback notice
  --teal:  #2F6F6B   secondary accent, matched-term chips
Ground the page in a faint graph-paper grid drawn with two repeating-linear-
gradients at low opacity. Monospace for all structural and spec text (labels,
stack chips, roadmap weeks, the fit gauge). A serif face for prose (summary,
why_fits). No border-radius above 3px anywhere. No drop shadows, no gradients
on buttons, no glassmorphism.
SIGNATURE ELEMENT: the fit gauge is a horizontal rail of 12 discrete segments,
filled to reflect the band (weak 3, moderate 6, strong 9, excellent 12), in
amber, with the band name set in small monospace caps beside it. This is the
one bold element — keep everything else quiet.

BEHAVIOUR:
- IdeaForm: interests and skills as comma-separated text inputs, difficulty as
  a select, duration_weeks and count as numbers. Disable the submit button
  while in flight and show a pending label. On a 422, render the `message` from
  the body next to the form. On a network failure, render a fixed string.
- IdeaCard: title, domain, difficulty and duration as monospace metadata;
  summary and why_fits as serif prose; features as a list; stack and
  skills_used as chips; roadmap as an ordered list of week strings.
  Show the matched interests and skills BY NAME, always visible, never behind
  a click. Never display a raw numeric score.
- When source === "fallback", show one calm line in --stamp above the results:
  "Generated offline from templates. The AI service is unavailable."
  Do not hide this and do not apologise in it.

QUALITY FLOOR:
- Usable at 375px width. Visible keyboard focus on every interactive element.
- @media (prefers-reduced-motion: reduce) removes all transitions.
- Render all server-provided text as plain text nodes. Do NOT use
  dangerouslySetInnerHTML anywhere, and do not add a markdown renderer.
- No new dependencies. No CSS framework. All CSS in app/globals.css.
- Define every CSS custom property you reference, and check for selector
  collisions between element-based and class-based rules before you finish.
````

### Agent Prompt 4 — the model path

````
Create lib/llm.ts and modify app/api/generate/route.ts to use it.

lib/llm.ts exports:
  callLlm(system: string, user: string): Promise<{ text: string } | { error: string }>

- Read LLM_API_KEY, LLM_BASE_URL, LLM_MODEL from process.env.
- If LLM_API_KEY is empty, return { error: "not_configured" } immediately
  without making a request.
- POST to `${LLM_BASE_URL}/chat/completions` using the OpenAI-compatible
  chat-completions shape, with global fetch. No SDK, no new dependency.
- Enforce a 15000 ms timeout with AbortController. On abort return
  { error: "timeout" }.
- Non-2xx -> { error: "http_<status>" }. Thrown/network error ->
  { error: "network" }. Never throw out of this function.
- Log the error cause server-side. NEVER log the key, any prefix of it, or
  the request headers.

In app/api/generate/route.ts, insert this before the fallback:
1. Build the prompt with buildGeneratePrompt.
2. Call callLlm. On any { error } -> log the cause and use the fallback.
3. On success: parseJsonObject(text). Null -> log "unparseable" and fall back.
4. Read the `ideas` array. Not an array, or empty -> fall back.
5. Map each element through sanitizeIdea, dropping nulls and counting discards.
   If ZERO ideas survive -> fall back.
6. Otherwise set source: "llm".
Then rank and respond exactly as before.

CRITICAL: a provider failure must return HTTP 200 with fallback content.
It must NEVER return 4xx or 5xx. Verify by breaking the key and re-running
the curl from step 2 — I expect 200 and source: "fallback".
````

### Agent Prompt 5 — persistence and mentoring

````
Create lib/supabase.ts, lib/session.ts, app/api/ideas/route.ts,
app/api/mentor/route.ts, components/MentorChat.tsx.
Wire a "Save this idea" button into IdeaCard and render MentorChat for a saved
idea. Install @supabase/supabase-js — this is the ONLY dependency you may add.

lib/supabase.ts: a server-only factory returning a client built from
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Add `import "server-only"` at the
top so importing it from a client component becomes a build error. There must
be no client-side Supabase client anywhere in this project.

lib/session.ts: getSessionId() for the browser — read "ideaforge_session" from
sessionStorage, create "s_" + a random 8-char id if absent. Guard for SSR by
returning "" when window is undefined.

Endpoints — implement exactly to this contract:
[PASTE §3, §4 and §5 of 03-api-contract.md HERE]

Notes that matter:
- POST /api/ideas re-runs sanitizeIdea on the submitted idea BEFORE insert.
  Do not trust the round trip through the browser.
- GET /api/ideas requires session_id. Missing -> 422. Never return unfiltered
  rows.
- /api/mentor: load the idea by id (404 if absent), classifyIntent(message),
  buildMentorPrompt, callLlm; on any failure use mentorFallbackReply(intent,
  idea) and set source: "fallback". Persist the user message and the reply.
- The current question goes in `message`. Do NOT append it to `history` before
  classifying intent.

MentorChat.tsx:
- Renders the thread, an input, and a send button disabled while in flight.
- Renders the user's message optimistically, and ROLLS IT BACK on failure,
  showing an error row in the thread instead. A message must never appear sent
  when it was not.
- All message content rendered as plain text nodes. No markdown renderer, no
  dangerouslySetInnerHTML.
- Style with the existing tokens in app/globals.css. Add no new colours.
````

---

## Part E · Failure playbook

Symptoms you are most likely to hit, and the fix, so you are not diagnosing from scratch at minute 140.

**`/api/health` reports `db_configured: false` in production but true locally.** The env vars were added to Vercel after the last deployment. Redeploy. Also confirm you ticked the Production environment, not only Preview.

**Supabase insert returns a row-level-security error.** You are using the anon key somewhere. The service role key bypasses RLS; the anon key with zero policies can do nothing. Check the actual value in the Vercel dashboard rather than assuming.

**The build fails on Vercel but `next dev` is fine.** Almost always a type error that dev mode tolerates, or a server-only module imported into a client component. Read the first error in the log, not the last.

**Generation returns 500 instead of falling back.** An exception is escaping `callLlm` or the parse step. Every provider interaction needs its own `try`/`catch` that converts a throw into a fallback. The contract requires 200.

**Model returns prose around the JSON.** Expected, and already handled — that is what stage three of `parseJsonObject` is for. If it still fails, the model returned a top-level array; read `ideas` defensively and treat a bare array as the ideas list.

**The function times out on Vercel.** Your provider timeout must be below the platform's function limit, not near it. Fifteen seconds against a longer platform ceiling leaves room to fall back and still respond.

**Everything works but the demo laptop has no network.** This is the scenario your fallback engine was built for. Run `next dev` locally with `LLM_API_KEY` empty. Full product, no internet.

---

## Part F · What to say about what you did not finish

Whatever you ship at T+172, some of the requirements document will be unimplemented. State that plainly rather than letting someone find it. "There is no authentication or rate limiting, so the endpoint is open — that is the first thing I would fix." "The ranking weights are reasoned, not tuned; I have no completion data to validate them against." "The mentor's fallback replies are generic by design; the model path is where the quality is."

Naming your own gaps is the cheapest credibility available, and it moves the conversation from *finding* the weakness to *discussing* it — which is a conversation you are prepared for.

---

*References and their repositories: `05-references.md`. Read the warning at the top of that file before you cite anything.*
