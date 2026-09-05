# GitHub Reference Repos (fork/inspire — do not clone verbatim)

> ⚠️ **Verify each repo is still active/public before the demo — link rot happens.** Check stars + last commit on the day of the hackathon.

## PRIMARY BASE — fork this one

**vercel/ai-chatbot**
https://github.com/vercel/ai-chatbot

- Next.js + Vercel AI SDK streaming chat app, Postgres, Auth.js-ready.
- **Why**: gives you streaming chat UI, message persistence pattern, and API route structure out of the box — saves ~1.5 hrs of scaffolding.
- **What to borrow**: chat streaming pattern, route structure (`app/api/chat/route.ts`), message component, Vercel AI SDK usage.
- **What to strip**: auth (skip for demo), unrelated chat history features.

## UI Speed

**shadcn/ui**
https://github.com/shadcn-ui/ui

- **Why**: copy-paste accessible React components (forms, tags input, cards, buttons) — no design time needed.
- **What to borrow**: form, badge/tag, card, tabs components for the idea cards and mentor chat layout.

## Agent Orchestration Pattern (reference only, don't need full adoption)

**langchain-ai/langgraph**
https://github.com/langchain-ai/langgraph

- **Why**: if time allows, reference their state-graph pattern for chaining Idea Generator → Mentor → Roadmap as sequential AI steps. If short on time, skip the graph and just do 3 sequential prompt calls (see Architecture doc).

## Build-Process Accelerator (optional install)

**DietrichGebert/ponytail**
https://github.com/DietrichGebert/ponytail

- **What it is**: makes your AI agent think like the laziest senior dev — YAGNI, minimal code, no gold-plating. ~126k stars, v4.9.0 (Aug 2026), actively maintained.
- **Why for THIS hackathon**: install it on your coding agent before Hour 1. It enforces "the best code is the code you never wrote" — which maps 1:1 to our PRD's *Explicitly Out of Scope* section. It stops the agent from adding auth/db/persistence features we deliberately cut.
- **How**: supports opencode (`.opencode/` dir + `opencode.json`) — install via its plugin instructions; no fork needed.
- **Caution**: it does NOT give you a UI base. Fork `vercel/ai-chatbot` for that. Ponytail is a guardrail on the agent, not a scaffold.

## Research/Mentor Reasoning Pattern

**assafelovic/gpt-researcher**
https://github.com/assafelovic/gpt-researcher

- **Why**: excellent example of "multi-step reasoning agent that produces a structured report" — same shape as our Mentor Deep-Dive output (breakdown → stack → roadmap). Study their prompt chaining structure, not their code, for how they force structured, cited, multi-section output.

## Credit line to use in code comments

> "Chat streaming pattern inspired by vercel/ai-chatbot.
> Multi-step mentor reasoning inspired by assafelovic/gpt-researcher.
> UI components from shadcn/ui."

## Decision summary

| Repo | Use | Effort |
|------|-----|--------|
| vercel/ai-chatbot | FORK — the base app | ~0 (it's the starting point) |
| shadcn/ui | Copy-paste components | low |
| langchain-ai/langgraph | Reference pattern only | skip if tight |
| assafelovic/gpt-researcher | Study prompt chaining | read-only, 10 min |
| DietrichGebert/ponytail | Agent guardrail (YAGNI), install before Hour 1 | 5 min |