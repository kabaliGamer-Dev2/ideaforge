# IdeaForge — Product Requirements

**Version** 1.0 · **Date** 2026-09-05 · **Build budget** 3 hours, single builder + AI coding agents
**Target platform** Next.js on Vercel, Supabase Postgres as the backend

---

## 1. What the product is

IdeaForge takes a final-year student's interests, existing skills, and practical constraints, and returns a small set of ranked, fully-specified capstone project ideas. Each idea arrives complete enough to start on: a feature list, a technology stack, a difficulty rating, a realistic duration, and a week-by-week build order. The student can then open a chat against any one of those ideas and ask follow-up questions — how to scope a feature down, what to do about a missing skill, what the examiner is likely to probe.

The problem it solves is narrow and real. Students do not lack ambition; they lack a well-specified starting point. The typical failure mode is picking a project that sounds impressive, discovering in month two that it needs a skill nobody on the team has, and shipping a hollow version of it. IdeaForge attacks that by making the *fit* between student and project explicit and visible before any code is written.

### One-sentence scope statement

> Given interests, skills, and constraints, produce ranked project specifications with a stated reason for each ranking, and answer follow-up questions about a chosen specification.

Anything that does not serve that sentence is out of scope for the 3-hour build.

---

## 2. Users

| User | What they need | How the product serves it |
|---|---|---|
| Final-year student (primary) | A project they can actually finish, matched to what they already know | Ranked ideas with an explicit fit explanation and a week-by-week roadmap |
| Project guide / faculty (secondary) | To judge whether the student's choice is defensible | The fit explanation and the roadmap are visible artifacts they can review |
| Panel examiner (indirect) | To probe whether the student understands their own choice | Roadmap and stack are specific, so the student can defend specifics |

The secondary and indirect users matter for one design reason: **the ranking must be explainable, not just correct.** A student who cannot say why their project was recommended cannot defend it. This makes explainability a functional requirement, not a nice-to-have.

---

## 3. Scope

### In scope for the 3-hour build

Interest and skill input. Idea generation through a language model. Deterministic fallback generation when the model is unavailable. Explainable ranking. Saving an idea. Mentor chat against a saved idea. Deployment to a public URL.

### Explicitly out of scope

User accounts and authentication. Team collaboration. File uploads. Payment. Email. Admin dashboards. Retrieval over a corpus of past projects. Idea deduplication across users. Mobile app. Anything requiring a background worker or a cron job.

The out-of-scope list is longer than the in-scope list on purpose. At three hours the binding constraint is not capability, it is decision count — every optional feature is a decision that costs minutes whether or not you build it.

---

## 4. Feature set, in build order

The order is the priority order. If you run out of time, you stop; you do not skip ahead.

| # | Feature | Priority | Why this position |
|---|---|---|---|
| F1 | Input form: interests, skills, difficulty, duration, count | Must | Nothing works without input |
| F2 | Deterministic template generator | Must | This is the demo safety net; build it *before* the LLM path, not after |
| F3 | Ranking with visible fit explanation | Must | The core differentiator and the viva defence |
| F4 | Results view: idea cards with features, stack, roadmap | Must | This is what the audience actually sees |
| F5 | LLM generation path | Must | The "AI" in the product; but it sits behind F2 in build order |
| F6 | Save an idea to Supabase | Should | Proves the backend is real and not just a stateless demo |
| F7 | Mentor chat against a saved idea | Should | The second half of the pitch |
| F8 | Message history persisted | Could | Cut first if behind schedule |
| F9 | Copy-idea-as-markdown button | Could | Cheap, high demo value, build only if ahead |

**The counter-intuitive ordering — F2 before F5 — is deliberate.** Building the fallback first means that at minute 40 you already have a working, demonstrable product. Every subsequent minute adds quality rather than adding the possibility of having nothing. If you build the LLM path first and it misbehaves at minute 150, you have no product at all.

---

## 5. Functional requirements

Each requirement is written so that a coding agent can implement it without asking a follow-up question, and so that you can test it in one action.

### Input

- **FR-1** The form accepts a free-text interests field and a free-text skills field, both comma-separated.
- **FR-2** The form accepts a target difficulty of `beginner`, `intermediate`, or `advanced`.
- **FR-3** The form accepts a target duration in weeks, an integer from 1 to 52.
- **FR-4** The form accepts a requested idea count, an integer from 1 to 20, defaulting to 5.
- **FR-5** Submission is rejected with a readable message if both interests and skills are empty. At least one is required.
- **FR-6** Whitespace-only entries in a comma-separated list are discarded, not turned into empty tags.

### Generation

- **FR-7** The system produces at most the requested count of ideas, and may produce fewer.
- **FR-8** Every returned idea carries: title, domain, summary, why-it-fits, difficulty, duration in weeks, feature list, stack list, skills-used list, and a week-by-week roadmap.
- **FR-9** An idea with no non-empty title is discarded, never repaired.
- **FR-10** A difficulty value outside the permitted set is normalised to `intermediate`. A valid value in the wrong case is lowercased.
- **FR-11** A duration that is null, zero, or negative is normalised to 6 weeks.
- **FR-12** A list field arriving as a comma-separated string is split into a list. Numeric elements are coerced to strings.
- **FR-13** A missing domain is set to `general`. A title longer than 255 characters is truncated.
- **FR-14** A non-numeric model score is treated as zero.

### Ranking

- **FR-15** Ideas are ranked by `score = 0.4 × model_score + 1.2 × interest_matches + 0.8 × skill_matches`, sorted descending.
- **FR-16** Match counting is case-insensitive substring counting against a corpus built from the idea's title, domain, summary, why-it-fits, skills-used, and features.
- **FR-17** The interface displays a bounded fit indicator, never the raw numeric score.
- **FR-18** Each idea displays which of the student's interests and skills it matched, by name.

### Fallback

- **FR-19** If no model credential is configured, generation uses the deterministic template engine and the response records that it did.
- **FR-20** If the model provider is unreachable, errors, or times out, generation falls back to the template engine.
- **FR-21** If the provider responds but returns nothing structurally valid, generation falls back to the template engine.
- **FR-22** All three fallback conditions are logged server-side with the distinguishing cause.
- **FR-23** A provider failure returns HTTP 200 with fallback content. It never returns 5xx.

### Persistence and mentoring

- **FR-24** A student can save an idea; the saved idea is retrievable in the same browser session.
- **FR-25** A student can send a message about a saved idea and receive a reply.
- **FR-26** The mentor reply is grounded in the saved idea's stored specification, which is passed as context.
- **FR-27** If a message send fails, the optimistically-rendered message is rolled back and an error is shown in the thread.

---

## 6. Non-functional requirements

**Performance.** A generation request completes within 20 seconds on the deployed instance, or falls back. A fallback-only generation completes within 500 ms. Vercel's serverless function timeout on the free tier is the hard ceiling — check your plan's limit and set your own timeout below it.

**Reliability.** No unhandled server error may result from malformed model output. Malformed output is a normal, expected condition, not an exception.

**Security.** Model and database credentials live in server-side environment variables only. No credential is ever prefixed with `NEXT_PUBLIC_`, sent to the browser, or written to a log line. Model-generated text is rendered as text, never as markup, so a prompt-injected response cannot inject script. The database is reachable only from server-side route handlers.

**Honesty about what security is *not* in place.** There is no authentication and no rate limiting. Anyone who finds the deployed URL can call the generation endpoint and spend your model credits. This is acceptable for a demo and unacceptable for public release. It must be stated aloud if anyone asks, and it belongs on your future-work list rather than being quietly omitted.

**Usability.** The fit explanation is visible without clicking. The interface is usable at 375 px width. Keyboard focus is visible. Reduced-motion preference is respected.

**Maintainability.** Sanitisation, ranking, and prompt construction each live in their own module with no framework imports, so each can be tested by running a plain script.

---

## 7. Acceptance test — the five things that must be true at the end

1. The deployed public URL loads and the form is usable.
2. Submitting interests and skills returns at least one ranked idea with a visible fit explanation naming a real matched interest.
3. With the model credential deliberately removed or invalidated, submission still returns ideas and the response marks itself as fallback.
4. An idea can be saved and then asked a question, and a grounded reply comes back.
5. No credential appears anywhere in the browser's network tab, page source, or console.

Item 3 is the one most people skip and the one most worth keeping. It is also the most impressive thing you can show a panel: unplug the AI, and the product still works.

---

## 8. Known limitations to state, not hide

The ranking weights are chosen by reasoning, not tuned against data — interest is weighted above skill on the argument that an uninterested student will not finish while a missing skill can be learned, but that argument is untested. The model's own score is the smallest term because it is unverifiable; it breaks ties rather than determining order. There is no measurement of whether recommended projects actually get completed, which is the only outcome that would truly validate the product. Duplicate or near-duplicate ideas across separate requests are not detected.

Stating these yourself is stronger than being asked about them.

---

*Continue to `02-architecture.md` for the system design, or jump to `04-build-plan-and-agent-prompts.md` if the clock is already running.*
