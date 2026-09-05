# IdeaForge — Start Here

Markdown documents only. No application code — your AI agents build that from the prompts in doc 04.

**Product** IdeaForge: a student enters interests, skills, and constraints, and gets ranked, fully-specified capstone project ideas with a visible reason for each ranking, then can ask a mentor follow-up questions about a chosen idea.

**Stack** Next.js App Router · TypeScript · Supabase Postgres · deployed on Vercel
**Budget** 180 minutes, start to public URL
**Date** 2026-09-05

---

## The five documents

| # | Document | What it is for | Read it |
|---|---|---|---|
| 01 | [Product requirements](01-product-requirements.md) | Scope, users, 27 functional requirements, non-functional requirements, the 5 acceptance tests | Before you start; again at the end to check what shipped |
| 02 | [Architecture and data model](02-architecture.md) | Layered design, both data flows, file tree, the Supabase SQL to paste, env vars, the 3 algorithms | Before the clock starts |
| 03 | [API contract](03-api-contract.md) | Exact request/response shapes for all 5 endpoints, error model, client obligations | Keep open; paste sections into agent prompts |
| 04 | [Build plan and agent prompts](04-build-plan-and-agent-prompts.md) | Minute-by-minute 180-minute timeline, 7 checkpoints, 6 copy-paste agent prompts, cut list, failure playbook | This is the one you work from |
| 05 | [References and repositories](05-references.md) | Every reference with its GitHub path beneath it, confidence rating, and a verification table | Before you submit — **and read its warning box** |

If you have twenty minutes before the clock starts, read 02 then 04. If you have five, read Part A of 04.

---

## The three things that decide whether you finish

**Deploy an empty app to Vercel inside the first twenty minutes.** The deployment pipeline is the only part of this build that can fail for reasons you cannot debug quickly. Finding that out at minute 15 costs five minutes. Finding out at minute 165 costs you the project.

**Build the deterministic fallback before the AI path.** By roughly the halfway mark you then have a complete, demonstrable product. Everything after that adds quality instead of adding the risk of having nothing. This is the single most useful inversion in the plan.

**One agent prompt per file group, each ending in a command you can run.** "Build me the app" gives you code you cannot review with errors scattered through it. Six scoped prompts mean every failure is contained to about twenty minutes of work.

---

## The one thing you must handle yourself

You asked for a live GitHub link beneath each reference. **I could not verify a single URL.** Network egress from my environment allows exactly one host, and web search is unavailable on this model — I tested GitHub four times during this project and it was blocked every time. Every path in doc 05 comes from training knowledge with a cutoff around May 2025, and repositories do get renamed and transferred.

Your own rule for this project was never to hallucinate a repository and to state uncertainty clearly when something cannot be verified. So doc 05 gives you each path with an honest confidence rating, a search phrase for finding its current home, and a fourteen-row verification table. **Filling that table takes about five minutes and is the difference between a defensible references section and a dead link an examiner finds before you do.** Four rows are flagged as least reliable — check those first, and delete rather than guess if one fails.

---

## Before you submit

Complete the verification table in doc 05 §5. Run the five acceptance tests in doc 01 §7 against the production URL, not localhost — env vars, timeouts, and cold starts all behave differently there. Confirm no credential appears in the browser's network tab, page source, or console. Confirm `.env.local` was never committed. Read doc 04 Part F and decide which unfinished items you will name out loud, because naming your own gaps is the cheapest credibility available and it turns the conversation from someone finding the weakness into a discussion you are prepared for.

---

## Honest scope note

These documents specify a product and a plan. They are not a record of a build — nothing here has been compiled, deployed, or run. The three algorithms in doc 02 §8 were previously implemented and verified against assertion suites in both Python and TypeScript, so the logic they describe is tested rather than theoretical; everything else is a specification your agents will realise.
