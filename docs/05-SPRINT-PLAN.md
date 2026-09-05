# 3-Hour Sprint Plan

## Hour 1 — Fork & Idea Generator

- [ ] Fork `vercel/ai-chatbot`, strip auth/db features not needed
- [ ] Build input form (interests, skills tags, weeks slider, difficulty select) using shadcn/ui
- [ ] Implement `/api/generate-ideas` route using Idea Generator Prompt
- [ ] Render 4 idea cards with title/stack/novelty score

**Agent prompt to paste:**

> "Using the forked vercel/ai-chatbot Next.js app, remove the auth and chat
> history persistence. Create a new page `/` with a form (interests as tag
> input, skills as tag input, weeks as number input, difficulty as select)
> using shadcn/ui components. On submit, POST to `/api/generate-ideas` with
> this exact prompt template: [paste Idea Generator Prompt from
> 04-ARCHITECTURE.md]. Parse the JSON response and render as cards with
> title, difficulty badge, tech stack badges, and novelty score."

## Hour 2 — Mentor Deep-Dive

- [ ] "Get Mentor Plan" button on each idea card
- [ ] Implement `/api/mentor` route using Mentor Deep-Dive Prompt, streamed
- [ ] Reuse the ai-chatbot streaming chat UI to render the mentor plan as it streams

**Agent prompt to paste:**

> "Add a 'Get Mentor Plan' button to each idea card. On click, navigate to
> `/mentor?idea=<id>` and stream a response from `/api/mentor` using the
> Vercel AI SDK `useChat`/`useCompletion` hook, using this prompt: [paste
> Mentor Deep-Dive Prompt]. Render the streamed markdown response using the
> existing chat message component styling."

## Hour 3 — Export, Polish, Deploy, Pitch

- [ ] "Download as Markdown" button (client-side blob download of mentor plan)
- [ ] Loading states, error handling, empty states
- [ ] Responsive check, basic dark mode (shadcn default)
- [ ] Deploy to Vercel, test live URL end-to-end
- [ ] Fill in `06-PITCH.md` with real screenshots/numbers
- [ ] Rehearse demo once, time it (<5 min)

**Agent prompt to paste:**

> "Add a 'Download as Markdown' button that converts the current mentor
> plan text into a downloadable .md file client-side. Add loading spinners
> for both API calls and a toast on error. Ensure the layout is responsive
> on mobile. Do not add new features."

## Cut list if running out of time (in priority order to drop)

1. Novelty score → drop, hardcode style badge instead
2. Viva questions section → drop from prompt if mentor output too slow
3. Dark mode polish → skip, ship default theme
4. Tag input component → fallback to plain comma-separated text input

## Pre-req checklist (do before Hour 1)

- [ ] GitHub account + fork of `vercel/ai-chatbot`
- [ ] OpenAI or Gemini API key (valid, with credit)
- [ ] Vercel account + CLI login
- [ ] Node 18+ / pnpm or npm installed
- [ ] Local clone running: `pnpm dev` boots the forked app