# IdeaForge — API Contract

All endpoints are Next.js App Router route handlers under `app/api/`. All accept and return `application/json`. All are same-origin; there is no CORS configuration and none is needed.

This document is the interface agreement between your frontend and backend agents. Hand it to both. If they disagree about a field name, this file wins.

---

## Conventions

Snake_case for all JSON field names, on the wire and in the database, so no translation layer is needed anywhere. Every response carries an `ok` boolean as its first field. Every timestamp is ISO 8601 UTC. Lists are always present as arrays, never null — an absent list is `[]`.

---

## 1. `GET /api/health`

Liveness plus configuration visibility. Build this first; it is how you confirm the deployment pipeline works before any feature exists.

**Response 200**

```json
{
  "ok": true,
  "service": "ideaforge",
  "version": "1.0.0",
  "time": "2026-09-05T09:14:22.104Z",
  "llm_configured": true,
  "db_configured": true
}
```

`llm_configured` and `db_configured` report only whether the relevant environment variables are non-empty. They must never echo a key, a key prefix, a key length, or a masked key. The existence of a credential is safe to report; anything about its content is not.

---

## 2. `POST /api/generate`

The core endpoint. Produces ranked, fully-specified ideas.

### Request

| Field | Type | Required | Rules |
|---|---|---|---|
| `interests` | string[] | one of `interests` / `skills` | Trimmed, empties dropped |
| `skills` | string[] | one of `interests` / `skills` | Trimmed, empties dropped |
| `difficulty` | string | no | `beginner` \| `intermediate` \| `advanced`, default `intermediate` |
| `duration_weeks` | integer | no | 1–52, default 12 |
| `count` | integer | no | 1–20, default 5 |
| `notes` | string | no | Free text constraints, max 1000 chars |

```json
{
  "interests": ["healthcare", "computer vision"],
  "skills": ["python", "react"],
  "difficulty": "intermediate",
  "duration_weeks": 12,
  "count": 5,
  "notes": "team of two, no paid APIs, college laptop only"
}
```

### Response 200

```json
{
  "ok": true,
  "source": "llm",
  "requested_count": 5,
  "returned_count": 3,
  "discarded_count": 1,
  "ideas": [
    {
      "id": "b1f2c3d4-0000-4000-8000-000000000001",
      "title": "Retinal Screening Triage Assistant",
      "domain": "healthcare",
      "summary": "A web tool that ranks uploaded fundus images by urgency so a small clinic can triage a day's queue in minutes.",
      "why_fits": "Directly uses your computer vision interest and your existing Python skill, with a React front end you already know.",
      "difficulty": "intermediate",
      "duration_weeks": 12,
      "features": [
        "Batch image upload with per-image status",
        "Urgency score with a visible confidence band",
        "Reviewer override with an audit trail",
        "Exportable triage report"
      ],
      "stack": ["Python", "PyTorch", "FastAPI", "React", "Postgres"],
      "skills_used": ["python", "react"],
      "roadmap": [
        "Week 1-2: dataset selection and licence check",
        "Week 3-4: baseline classifier and evaluation harness",
        "Week 5-7: upload pipeline and storage",
        "Week 8-9: reviewer interface and override flow",
        "Week 10-11: report export and error handling",
        "Week 12: evaluation write-up and demo"
      ],
      "fit": {
        "matched_interests": ["healthcare", "computer vision"],
        "matched_skills": ["python", "react"],
        "band": "strong"
      }
    }
  ]
}
```

### Field notes

`source` is `"llm"` or `"fallback"`. It exists so the interface can be honest about which engine served the request, and so your acceptance test can prove the fallback works.

`returned_count` may be lower than `requested_count`. That is not an error — it is the discard rule working. `discarded_count` tells you how many candidates failed sanitisation, which is useful during the build and worth showing in a small footnote during a demo.

`fit.band` is one of `weak`, `moderate`, `strong`, `excellent`. **The raw numeric score is not in the response.** A number like `4.7` is meaningless to a student and invites the question "out of what?" A band plus the named matches is an explanation; a float is not.

`id` is generated server-side per idea in the response so the client has a stable key for React lists and for the save call. It is not a database identifier until the idea is saved.

### Response 422 — validation failure

```json
{
  "ok": false,
  "error": "validation_failed",
  "message": "Enter at least one interest or one skill.",
  "fields": { "interests": "Required if no skills are given." }
}
```

`message` is written for the student and rendered directly in the interface. `fields` keys map to form field names.

### Response 500

Reserved for genuine server defects only. A provider failure must not reach here — it returns 200 with `source: "fallback"`. If you see a 500 from this endpoint, you have a bug, not an outage.

---

## 3. `POST /api/mentor`

One conversational turn about a saved idea.

### Request

| Field | Type | Required | Rules |
|---|---|---|---|
| `idea_id` | uuid | yes | Must be a saved idea |
| `session_id` | string | yes | Browser session identifier |
| `message` | string | yes | 1–2000 chars, the current question |
| `history` | object[] | no | Prior turns, `{ role, content }`, max 20 |

```json
{
  "idea_id": "b1f2c3d4-0000-4000-8000-000000000001",
  "session_id": "s_8f3a91c2",
  "message": "I don't know PyTorch yet. Can I still do this in 12 weeks?",
  "history": [
    { "role": "user", "content": "How hard is the dataset part?" },
    { "role": "assistant", "content": "Licensing is the real constraint..." }
  ]
}
```

**The current question goes in `message`, not appended to `history`.** Intent is classified from `message` alone. Putting it in the history array is the single most common integration mistake here and it silently degrades every reply.

### Response 200

```json
{
  "ok": true,
  "source": "llm",
  "intent": "skill_gap",
  "reply": "Twelve weeks is enough, but the order matters. Spend weeks 1-2 on...",
  "message_id": "c9e1..."
}
```

`intent` is one of `scope`, `skill_gap`, `stack`, `timeline`, `viva`, `general`. It is returned so the interface can label the reply and so the fallback engine has a key to select canned guidance.

### Response 404

```json
{ "ok": false, "error": "idea_not_found", "message": "Save this idea before asking about it." }
```

---

## 4. `POST /api/ideas` — save

### Request

```json
{ "session_id": "s_8f3a91c2", "idea": { /* one idea object, as returned by generate */ } }
```

The server re-runs sanitisation on the submitted idea before insert. Never trust that the object came back unmodified just because you sent it out — the round trip goes through a browser you do not control.

### Response 201

```json
{ "ok": true, "id": "b1f2c3d4-0000-4000-8000-000000000001" }
```

---

## 5. `GET /api/ideas?session_id=s_8f3a91c2`

### Response 200

```json
{ "ok": true, "count": 2, "ideas": [ /* saved idea objects, newest first */ ] }
```

`session_id` is required. Without it, return 422 rather than every row in the table — a missing filter that silently returns everything is how demos leak other people's data.

---

## 6. Error model summary

| Status | When | Body `error` |
|---|---|---|
| 200 | Success, including provider-failure-with-fallback | — |
| 201 | Idea saved | — |
| 404 | Referenced idea does not exist | `idea_not_found` |
| 422 | Input failed validation | `validation_failed` |
| 500 | Server defect | `internal_error` |

There is deliberately no 401, 403, or 429, because there is no authentication and no rate limiting. That absence is documented in `01-product-requirements.md` §6 and is the first thing to fix after the deadline.

---

## 7. What the client must handle

Every fetch needs a `try`/`catch` around it and a check on `res.ok`, because a network failure and a 422 arrive by completely different mechanisms and both are ordinary. Render `message` from the body when present; fall back to a fixed string when the body is unreadable.

For the mentor chat, render the user's message optimistically so the interface feels responsive, and **roll it back on failure** rather than leaving a message on screen that the server never received. A message that appears sent but was not is worse than a visible error.

Never render model text through a markup renderer. Plain text nodes only. A prompt-injected response that contains a `<script>` tag should appear as the literal characters of a script tag and do nothing.

---

*Next: `04-build-plan-and-agent-prompts.md` — the timeline and the prompts to run.*
