# Architecture (lightweight — built for 3 hours, not for scale)

## 1. Stack

- **Next.js (App Router)** — forked from `vercel/ai-chatbot`
- **Vercel AI SDK** (`ai` package) — streaming LLM calls
- **OpenAI/Gemini API** (whichever key you have)
- **shadcn/ui** — components
- **No DB required for MVP** (in-memory/session state only)
- **Deploy**: Vercel (1-click)

## 2. Data Model (in-memory, no persistence needed)

```ts
type UserProfile = {
  interests: string[]
  skills: string[]
  weeksAvailable: number
  difficulty: "beginner" | "intermediate" | "advanced"
}

type ProjectIdea = {
  title: string
  problemSolved: string
  whyItFits: string
  difficulty: string
  techStack: string[]
  noveltyScore: number // 1-10
}

type MentorPlan = {
  features: { mvp: string[]; stretch: string[] }
  techStackJustified: { tech: string; why: string }[]
  roadmap: { week: number; milestone: string }[]
  pitfalls: string[]
  vivaQuestions: string[]
}
```

## 3. API Routes

| Route | Method | Request → Response | Streaming |
|-------|--------|--------------------|-----------|
| `/api/generate-ideas` | POST | `UserProfile` → `ProjectIdea[]` | JSON (fast) or streamed |
| `/api/mentor` | POST | chosen `ProjectIdea` → `MentorPlan` | Streamed as chat |

## 4. Prompt Templates

### Idea Generator Prompt

```
You are a final-year project advisor. Given the student's interests: {interests},
skills: {skills}, time available: {weeksAvailable} weeks, difficulty: {difficulty}.

Generate 4 distinct, technically feasible final-year project ideas.
For each, output strict JSON:
{ title, problemSolved, whyItFits, difficulty, techStack: string[], noveltyScore: 1-10 }

Rules:
- Ideas must be buildable within {weeksAvailable} weeks by ONE student.
- Must use at least one of the student's existing skills.
- Avoid generic ideas (no "todo app", "weather app") unless heavily twisted with AI/novel angle.
- Return valid JSON array only.
```

### Mentor Deep-Dive Prompt

```
You are an expert technical mentor. The student chose this project:
{selectedIdea}. Their skills: {skills}. Weeks available: {weeksAvailable}.

Produce a structured mentor plan with these sections (markdown):
## MVP Features
## Stretch Features
## Recommended Tech Stack (with justification per choice)
## Week-by-Week Roadmap (exactly {weeksAvailable} weeks)
## Common Pitfalls
## Viva/Defense Questions (5 likely questions + how to answer)

Be specific and actionable, not generic. Assume the student has to defend
this in front of examiners.
```

## 5. Flow

```
[Input Form] --> POST /api/generate-ideas --> [Idea Cards]
                                                    |
                                       user picks one idea
                                                    v
                                       POST /api/mentor (streamed)
                                                    v
                                       [Mentor Chat Panel] --> [Export .md]
```

## 6. Explicit non-decisions (for 3-hour scope)

- No auth
- No DB
- No queue
- No microservices
- No fine-tuned models

Intentionally. Every one of these is a "swap later" item, not a build item.