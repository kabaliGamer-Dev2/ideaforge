# PRD — IdeaForge: AI Project Idea Generator & Mentor

## 1. Problem

Final-year students waste weeks picking a project. Generic idea lists (static blogs, "100 project ideas" pages):

- Don't match a student's actual skills.
- Aren't technically actionable.
- Give zero guidance after idea selection.

## 2. Target User

CS/IT final-year undergrads with some skills (e.g., "React, Python, basic ML") who need:

1. A feasible idea.
2. A tech stack.
3. A build roadmap they can actually finish in one semester.

## 3. Success Criteria (Hackathon Judging)

- **Working demo in <5 min**: input skills → get 3 tailored ideas → pick one → get a full mentor breakdown (features, stack, roadmap, viva prep).
- **Visibly personalized output** (not generic ChatGPT copy-paste feel).
- **Clean, fast UI. Streaming AI responses** (feels "alive").
- **One clear differentiator** (see below).

## 4. MVP Scope (build in 3 hours — nothing else)

1. **Input form**: interests (tags), skills (tags), time available (weeks), difficulty preference.
2. **Idea Generator**: LLM returns 3–5 structured project ideas (title, problem solved, why-it-fits-you, difficulty, tech stack, novelty score 1–10).
3. **Mentor Deep-Dive** (chat, streaming): user picks one idea → AI mentor produces:
   - Feature breakdown (MVP vs stretch)
   - Recommended tech stack + why
   - Step-by-step roadmap with weekly milestones
   - Common pitfalls / viva (defense) questions
4. **Export**: "Download as Markdown" button (skip PDF, no time).
5. **No auth needed** for hackathon demo (optional stub only if trivial).

## 5. Explicitly Out of Scope (for 3 hrs)

- User accounts / persistence beyond session
- Payment, teams, collaboration
- Fine-tuned models — use prompt engineering only
- Mobile app

## 6. Differentiator (pick ONE to emphasize to judges)

> "Not a static idea list — a personalized mentor that reasons about YOUR skill gaps and gives a week-by-week build plan, like a professor would."

## 7. Success Metrics (for the pitch)

- Time-to-idea: < 10 seconds after form submit
- Ideas returned: 3–5 structured cards
- Mentor plan sections: 6 (MVP, stretch, stack, roadmap, pitfalls, viva)
- Demo length: < 5 minutes