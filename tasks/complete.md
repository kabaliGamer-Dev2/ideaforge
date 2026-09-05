# IdeaForge — Task Register

Live status of every build task, per Plan B (2.0). Updated at each checkpoint.
Companion: `incomplete/incomplete.md` (everything not yet done, with the reason).

---

## ✅ Completed tasks

| # | Task | Where | Verified by | Date |
|---|---|---|---|---|
| 1 | Node 24 + npm 11 + git confirmed | environment | `node -v` | 2026-09-05 |
| 2 | Next.js scaffold: TS, App Router, no Tailwind/ESLint | repo root | `npm run build` green | 2026-09-05 |
| 3 | `.gitignore` covers `.env*` **before** first commit | `.gitignore` | `git check-ignore .env.local` | 2026-09-05 |
| 4 | `.env.example` committed empty; real key only in `.env.local` | root | repo-wide key grep = 0 hits | 2026-09-05 |
| 5 | Initial commit of stripped scaffold | git | `git log` | 2026-09-05 |
| 6 | Health endpoint (`GET /api/health`) | `app/api/health/route.ts` | curl → `{ok:true, llm_configured, db_configured}` | 2026-09-05 |
| 7 | Domain types + difficulty constants | `lib/types.ts` | compiled | 2026-09-05 |
| 8 | 3-stage string-aware JSON extractor | `lib/sanitize.ts` | 8/8 assertions | 2026-09-05 |
| 9 | Field sanitisation (discard-on-missing-title etc.) | `lib/sanitize.ts` | 12/12 assertions | 2026-09-05 |
| 10 | Explainable ranking (`0.4·model + 1.2·interest + 0.8·skill`) | `lib/sanitize.ts` | 3/3 assertions | 2026-09-05 |
| 11 | Prompt builder + mentor intent classifier | `lib/prompt.ts` | compiled | 2026-09-05 |
| 12 | Deterministic fallback engine (10 templates, byte-identical) | `lib/fallback.ts` | 3/3 assertions | 2026-09-05 |
| 13 | Verification script, zero deps | `scripts/check-logic.mjs` | **26 passed, 0 failed** | 2026-09-05 |
| 14 | `/api/generate` — validation, 422, clamps, rank, fit bands | `app/api/generate/route.ts` | curl happy + 422 paths | 2026-09-05 |
| 15 | LLM provider `callLlm` (Groq, 15 s timeout, never throws) | `lib/llm.ts` | live call | 2026-09-05 |
| 16 | Dual-path wiring: provider failure → 200 + fallback | `app/api/generate/route.ts` | broken-key test → 200 `source:fallback` in 0.13 s | 2026-09-05 |
| 17 | UI: IdeaForm (interests/skills/weeks/difficulty/count) | `components/IdeaForm.tsx` | build + browser | 2026-09-05 |
| 18 | UI: IdeaCard (meta, prose, features, stack chips, roadmap) | `components/IdeaCard.tsx` | build | 2026-09-05 |
| 19 | UI: 12-segment FitGauge + named match chips | `components/FitGauge.tsx`, `IdeaCard.tsx` | build | 2026-09-05 |
| 20 | UI: ResultsList with fallback notice (stamp red, calm) | `components/ResultsList.tsx` | build | 2026-09-05 |
| 21 | Design tokens + graph-paper grid + a11y (focus, reduced-motion) | `app/globals.css` | build | 2026-09-05 |
| 22 | Production build green after all changes | `npm run build` | ✓ Compiled | 2026-09-05 |
| 23 | Feature commit (no secrets) | git `dc3301a` | key grep = 0 | 2026-09-05 |
| 24 | Hallmark anti-slop design skill installed | `~/.agents/skills/hallmark/` | SKILL.md + 3 references | 2026-09-05 |

**Local dual-path proven:** `source: "llm"` observed with live Groq key; `source: "fallback"` observed with broken key. Acceptance test 3 (unplug-the-AI) passes **locally** — must be re-run against production after deploy.

---

## Running totals

- Completed tasks: **24**
- Open tasks: see `incomplete/incomplete.md`
- Checkpoints passed: A (local boot) · C (26/26 assertions) · D (ideas over HTTP) · E (UI renders) · F (both sources, no 5xx)
- Checkpoints pending: B (production health flags) · G (save + chat)

---

*Next: `incomplete/incomplete.md` for what remains and why.*