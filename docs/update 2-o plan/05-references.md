# IdeaForge — References and Source Repositories

---

## ⚠ Read this before citing anything below

**I could not open a single one of these URLs.** Network egress from my environment permits exactly one host (`agentrouter.org`), and web search is unavailable on this model. I tested GitHub access four separate times during this project; it was blocked every time.

So every link below comes from training knowledge with a cutoff around **May 2025**, not from a live check. Repositories get renamed, transferred between organisations, and archived. A path that was correct in early 2025 may 404 today, and GitHub's redirect on a rename is not guaranteed to survive a second move.

Your own standing rule for this project was *never hallucinate repositories; if information cannot be verified, state the uncertainty clearly.* This section is me holding to it rather than handing you a list that looks authoritative and gets you caught.

**What to do about it:** §5 is a verification table. Clicking through it takes about five minutes and converts this from a liability into a genuinely defensible references section. Do that before you submit anything. Each entry carries a confidence rating and a search phrase so you can find the current home even if the path has moved.

Confidence key — **High**: major project, stable organisation, path unlikely to have changed. **Medium**: well-known but the org or repo name has plausibly shifted. **Low**: I recall the project but am not confident of the current path; verify or drop it.

---

## 1. Framework and platform

### Next.js — App Router, route handlers, server/client component boundary

The App Router's file-based routing and the `route.ts` handler convention are the structural basis of this project. What is worth reading specifically is the server/client component split: the rule that a component is a server component unless marked `"use client"`, and what that implies for where a secret may be referenced. IdeaForge depends on that boundary for its security model — every credential is touched only in a server context.

```
https://github.com/vercel/next.js
```
**Confidence: High.** Search phrase if needed: `next.js github vercel`

### React

Hooks-based state for the form, the results list, and the chat thread. Nothing exotic is used — `useState` and `useEffect` only.

```
https://github.com/facebook/react
```
**Confidence: High.**

### Vercel platform examples

Worth a skim for one narrow reason: how example projects declare environment variables and what their `next.config` files do and do not contain. IdeaForge's config is deliberately close to empty, and it is useful to confirm that this is normal rather than an omission.

```
https://github.com/vercel/examples
```
**Confidence: Medium** — this repository has been restructured more than once.

---

## 2. Backend and database

### Supabase — platform monorepo

The reference for the SQL surface, row-level-security semantics, and the difference between the anon key and the service role key. That distinction is load-bearing in IdeaForge: RLS is enabled with zero policies precisely so the anon key is inert and only the server-side service role can reach the data.

```
https://github.com/supabase/supabase
```
**Confidence: High.**

### supabase-js — the JavaScript client

The only external dependency IdeaForge adds. Used solely inside route handlers.

```
https://github.com/supabase/supabase-js
```
**Confidence: High.**

### ⚠ Server-side Supabase auth helpers — a package rename that will cost you time

There is a real, disruptive change here that you should know about before an agent generates code against the old package. The older `@supabase/auth-helpers-nextjs` package was **deprecated in favour of `@supabase/ssr`**. Tutorials, blog posts, and — importantly — AI coding agents trained on older material will confidently generate imports from the deprecated package.

IdeaForge sidesteps this entirely: with no authentication and no client-side database access, neither package is needed. Plain `supabase-js` with the service role key inside a route handler is sufficient. **If your agent tries to install an auth-helpers package, stop it — that is a symptom of it inventing an auth requirement you did not ask for.**

```
https://github.com/supabase/auth-helpers
```
**Confidence: Low on the path, High on the deprecation fact.** Search phrase: `supabase ssr package deprecated auth-helpers`

---

## 3. AI integration patterns

### Vercel AI SDK

The most directly relevant reference in this document, and the one most likely to save you time. It covers streaming responses from a language model through a Next.js route handler and consuming them in a client component. It also standardises across providers, which is the same problem IdeaForge's `lib/llm.ts` solves in a smaller way.

IdeaForge deliberately does **not** use it. A hand-rolled `fetch` against an OpenAI-compatible endpoint is about forty lines, adds no dependency, and gives you full control over the timeout and error-to-fallback mapping — which is the part of the design you actually need to defend. Streaming is the feature you give up, and at a three-hour budget that is the right trade. Read the SDK to understand the pattern; implement the small version.

```
https://github.com/vercel/ai
```
**Confidence: High.**

### Next.js AI chatbot template

The closest public analogue to IdeaForge's mentor feature: a Next.js chat interface with persistence. Study the message-thread rendering and the optimistic-send behaviour. IdeaForge differs in that its chat is scoped to a single stored idea and passes that idea's specification as context on every turn, so replies stay grounded in a specific project rather than roaming.

```
https://github.com/vercel/ai-chatbot
```
**Confidence: Medium** — the repository is real, but templates of this kind get restructured or superseded.

### OpenAI Node client

Read for the exact request and response shape of the chat-completions API, which is the shape `lib/llm.ts` targets. Not installed — a direct `fetch` avoids the dependency.

```
https://github.com/openai/openai-node
```
**Confidence: High.**

### Structured-output extraction — the untrusted-output problem

The core insight to take from this space is that a language model asked for JSON will sometimes return prose, sometimes a fenced block, and sometimes a fenced block with commentary around it. Libraries in this category solve it with schema-guided retry loops.

IdeaForge takes the opposite approach on purpose: **extract and discard rather than retry.** A retry loop costs a second round trip on every malformed response, and in a demo you cannot afford latency you did not plan for. The three-stage extractor plus field-level sanitisation handles the realistic failure modes in a single pass, and an unsalvageable candidate is dropped rather than repaired.

```
https://github.com/instructor-ai/instructor
https://github.com/instructor-ai/instructor-js
```
**Confidence: Medium** on the Python repo, **Low** on the JS sibling's exact path.

### Multi-provider routing

Relevant if you later want to switch providers without changing application code — which is the direction IdeaForge's `LLM_BASE_URL` environment variable already points, in miniature.

```
https://github.com/BerriAI/litellm
```
**Confidence: Medium.**

---

## 4. Ranking and recommendation

### Surprise — recommender algorithms

Studied for the framing distinction that shaped IdeaForge's ranking: collaborative filtering needs interaction history, which a first-time user does not have. IdeaForge therefore uses content-based matching against self-declared interests and skills — a cold-start-only system, by necessity.

If asked why you did not use collaborative filtering, that is the answer: there is no interaction data to filter on, and inventing some would be dishonest.

```
https://github.com/NicolasHug/Surprise
```
**Confidence: High.**

### Recommender systems reading list

Useful for the vocabulary — cold start, content-based versus collaborative, explainability — which is worth having precise when you defend the design.

```
https://github.com/jihoo-kim/awesome-RecSys
```
**Confidence: Low** on the exact path; curated lists change hands often. Search phrase: `awesome recommender systems github`

---

## 5. Verification table — complete this yourself

Five minutes with a browser. Open each path, and record what you find. If a path redirects, **write down the destination and cite that**, because the redirect may not survive.

| # | Path as given | Resolves? | Final path after redirect | Stars | Last commit | Checked |
|---|---|---|---|---|---|---|
| 1 | `vercel/next.js` | | | | | |
| 2 | `facebook/react` | | | | | |
| 3 | `vercel/examples` | | | | | |
| 4 | `supabase/supabase` | | | | | |
| 5 | `supabase/supabase-js` | | | | | |
| 6 | `supabase/auth-helpers` | | | | | |
| 7 | `vercel/ai` | | | | | |
| 8 | `vercel/ai-chatbot` | | | | | |
| 9 | `openai/openai-node` | | | | | |
| 10 | `instructor-ai/instructor` | | | | | |
| 11 | `instructor-ai/instructor-js` | | | | | |
| 12 | `BerriAI/litellm` | | | | | |
| 13 | `NicolasHug/Surprise` | | | | | |
| 14 | `jihoo-kim/awesome-RecSys` | | | | | |

**Check these four first** — they are the ones I rate least reliable: rows 6, 11, 14, and 3. If any fails and the search phrase does not find a clear successor, **delete the row rather than guessing.** A references section with ten verified entries is worth more than one with fourteen entries where four are wrong, and a single dead link invites the examiner to check the rest.

---

## 6. Attribution by subsystem

For the report section that asks what came from where.

| IdeaForge component | Pattern taken from | How this implementation differs |
|---|---|---|
| Route handlers, server/client split | Next.js App Router conventions | Standard usage; no framework extension |
| Database access with service role | Supabase RLS model | RLS enabled with zero policies, server-only access, no client SDK |
| Provider call and error mapping | OpenAI chat-completions shape; Vercel AI SDK's provider abstraction | Hand-rolled `fetch`, no SDK; explicit timeout; every failure maps to a fallback rather than an exception |
| JSON extraction from model output | Structured-output libraries' extraction stage | Three-stage extract-or-discard in one pass; no schema-guided retry |
| Ranking | Content-based recommendation | Fixed reasoned weights, no training data; explainability is a functional requirement, not diagnostics |
| Fallback engine | No direct precedent found | Original; deterministic template engine behind the same interface as the model path |
| Chat thread and optimistic send | Next.js chat templates | Scoped to one stored idea, whose specification is passed as context every turn |

The fallback engine row is worth saying out loud in a viva. Dual-path degradation of this kind is uncommon in student projects and it is the most defensible design decision in the build.

---

## 7. Citation formats

**IEEE**, for a numbered reference list:

> [1] Vercel, "Next.js," GitHub repository. [Online]. Available: https://github.com/vercel/next.js. [Accessed: DD-Mon-2026].

**APA 7th:**

> Vercel. (2026). *Next.js* [Computer software]. GitHub. https://github.com/vercel/next.js

Fill the access date with the date you actually clicked the link, not the date you wrote the report. An accessed-date on a link you never opened is the specific kind of small dishonesty that examiners notice.

---

## 8. What is not cited, because it is original

The dual-path degradation architecture. The specific ranking formula and its weighting rationale. The three-stage string-aware brace-depth extractor. The discard-on-missing-title rule. The engineering-spec-sheet visual direction and the segmented fit gauge. The intent-keyed mentor fallback.

None of these were copied from a repository, and no source was cloned at any point during this project. The references above informed patterns and vocabulary; the implementation is yours.

---

*Back to `00-START-HERE.md`.*
