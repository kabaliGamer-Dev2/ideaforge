# IdeaForge — Incomplete Tasks

Everything not yet done, with the blocker named. Updated at each checkpoint.
Companion: `tasks/complete.md` (24 tasks completed).

---

## 🔒 Block 6 — Persistence & mentor chat (T+130 → T+155)

| Task | Blocker | Unblocked by |
|---|---|---|
| Create Supabase project + region | **Needs your browser + account** | You create it at supabase.com, paste the URL here |
| Paste schema (ideas + messages, RLS on, 0 policies) | needs Supabase project | see `06-implementation-details.md` §8 |
| Copy URL + **service role** key (not anon) | needs Supabase project | Project Settings → API |
| Fill `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` + Vercel | needs key | above |
| `lib/supabase.ts` server-only factory (`import "server-only"`) | above | Agent Prompt 5 |
| `lib/session.ts` browser session id (`ideaforge_session`) | above | Agent Prompt 5 |
| `POST /api/ideas` save (re-sanitise before insert) | above | Agent Prompt 5 |
| `GET /api/ideas?session_id=` (422 when missing) | above | Agent Prompt 5 |
| `POST /api/mentor` (load idea → classify intent → LLM → intent-keyed fallback, persist both) | above | Agent Prompt 5 |
| `MentorChat.tsx` (optimistic send, rollback on failure, plain text only) | above | Agent Prompt 5 |
| Checkpoint G: save → reload → still there → ask → grounded reply | above | all of Block 6 |

## 🚧 Block 7 — Ship & verify in production (T+155 → T+180)

| Task | Blocker | Unblocked by |
|---|---|---|
| Push repo to GitHub | **Needs your GitHub account** | `gh repo create` or web UI |
| Import into Vercel, set 5 env vars (Prod+Preview+Dev) | **Needs your Vercel account** | vercel.com/new |
| Checkpoint B: `/api/health` shows both flags true in production | deploy | above |
| Run 5 acceptance tests **against the production URL** (env vars/timeouts/cold starts differ) | deploy | `01-product-requirements.md` §7 |
| Fallback demo tab: second preview deployment with broken key | deploy | Block 6/7 |
| Fill `06-PITCH.md` fill-ins + screenshot set | after deploy | — |

## 🎨 Nice-to-have (only if Checkpoint G passes early)

| Task | Effort | Notes |
|---|---|---|
| Hallmark `audit` of the current page (anti-slop punch list) | 10 min | skill installed at `~/.agents/skills/hallmark/` |
| Stream mentor replies on the LLM path only (AI SDK or SSE) | 20 min | garnish on a safe core — never the core itself |
| Copy-idea-as-markdown button (F9) | 10 min | client-side blob download |

---

## Cut list status

| Cut | Applied? |
|---|---|
| Notes field handling / discarded_count | No — both live |
| Fit gauge visual → plain text | No — gauge live |
| Ship on fallback only | **No — LLM path live and proven** |
| Mentor chat entirely | Not yet needed |
| Save as well (stateless ship) | Not yet needed |

## Honest gaps to state in the viva

1. No auth, no rate limiting — endpoint open; first fix after deadline.
2. Ranking weights reasoned, not tuned; no completion data to validate them.
3. Fallback replies generic by design; LLM path is where quality lives.
4. Supabase keys not yet provisioned; persistence untested until Block 6.

---

*Back to `tasks/complete.md`.*