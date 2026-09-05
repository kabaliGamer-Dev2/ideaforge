import type { GenerateInput, Idea, MentorIntent, ProjectFiles, ResearchDossier } from "../src/lib/types.ts";
import { createHash } from "node:crypto";

function deterministicId(seed: string): string {
  return createHash("sha1").update(seed).digest("hex").slice(0, 32);
}

interface Template {
  domain: string;
  keywords: string[];
  title: (i: string[]) => string;
  summary: (i: string[]) => string;
  features: string[];
  stack: string[];
}

const TEMPLATES: Template[] = [
  {
    domain: "health",
    keywords: ["health", "medical", "clinic", "patient", "hospital", "doctor", "fitness", "wellness"],
    title: (i) => `${i[0] ? i[0] + "-powered " : ""}Patient Triage & Health Record Assistant`,
    summary: (i) =>
      `A web tool that organises clinic patient intake — triage priority, follow-up reminders, and a browsable visit history — matched to your interest in ${i[0] ?? "healthcare"}.`,
    features: ["Patient intake with triage priority", "Follow-up reminder queue", "Visit history browser", "Exportable summary report"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "education",
    keywords: ["education", "learning", "student", "course", "study", "exam", "college", "school", "tutor"],
    title: (i) => `Personalised Study Planner & Progress Tracker`,
    summary: (i) =>
      `Turns a syllabus into a week-by-week study plan, tracks completion, and flags topics falling behind — built around your ${i[0] ?? "education"} interest.`,
    features: ["Syllabus-to-schedule converter", "Weekly completion tracking", "At-risk topic detection", "Revision queue"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "agriculture",
    keywords: ["agriculture", "farm", "crop", "soil", "farming", "irrigation", "agri"],
    title: (i) => `Crop Advisory & Field Log Dashboard`,
    summary: (i) =>
      `A dashboard that logs field observations, tracks water and fertiliser schedules, and flags weather-based advisories — personalised with your ${i[0] ?? "agriculture"} interest.`,
    features: ["Field observation log", "Irrigation schedule tracker", "Weather advisory flags", "Season summary report"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "finance",
    keywords: ["finance", "budget", "money", "bank", "expense", "investment", "wallet", "payment"],
    title: (i) => `Expense Insight & Budget Coach`,
    summary: (i) =>
      `Categorises expenses, detects spending drift, and suggests a realistic budget — a practical ${i[0] ?? "finance"} project you can demo with real data.`,
    features: ["Expense categorisation", "Spending drift alerts", "Budget builder", "Monthly insight report"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "logistics",
    keywords: ["logistics", "delivery", "fleet", "supply", "transport", "courier", "shipment"],
    title: (i) => `Delivery Route Optimiser for Local Couriers`,
    summary: (i) =>
      `Sequences daily delivery stops to minimise travel, with a driver view and dispatch view — a ${i[0] ?? "logistics"} problem with a measurable outcome.`,
    features: ["Stop sequencing with route order", "Driver dispatch view", "Distance/time estimates", "Daily run summary"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "sustainability",
    keywords: ["sustainability", "environment", "green", "carbon", "waste", "recycle", "energy", "climate"],
    title: (i) => `Campus Energy & Waste Tracker`,
    summary: (i) =>
      `Monitors campus electricity and waste streams, surfaces anomalies, and sets reduction targets — aligned with your ${i[0] ?? "sustainability"} interest.`,
    features: ["Energy consumption log", "Waste stream tracking", "Anomaly flags", "Reduction target board"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "accessibility",
    keywords: ["accessibility", "disability", "inclusive", "blind", "deaf", "assistive", "a11y"],
    title: (i) => `Assistive Reading Companion for Low-Vision Users`,
    summary: (i) =>
      `Reads uploaded text aloud at a comfortable rate with adjustable contrast and font size — an ${i[0] ?? "accessibility"} project with an obvious user and a defensible scope.`,
    features: ["Text upload and reading view", "Rate and contrast controls", "Session bookmarks", "Reading progress"],
    stack: ["React", "Next.js", "Node"],
  },
  {
    domain: "civic data",
    keywords: ["civic", "public data", "government", "open data", "municipal", "city", "ward", "rti"],
    title: (i) => `Ward-Level Civic Issue Tracker`,
    summary: (i) =>
      `Maps reported civic issues to ward boundaries and tracks resolution status — a ${i[0] ?? "civic data"} project that works with real open datasets.`,
    features: ["Issue reporting with ward mapping", "Resolution status tracking", "Ward comparison view", "Open-data import"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "retail",
    keywords: ["retail", "shop", "store", "inventory", "ecommerce", "e-commerce", "sales", "mall"],
    title: (i) => `Stock Alert & Reorder Assistant for Small Shops`,
    summary: (i) =>
      `Tracks inventory levels, predicts reorder points, and alerts on stock-outs — a ${i[0] ?? "retail"} project small shops would actually use.`,
    features: ["Inventory level tracking", "Reorder-point alerts", "Stock-out flags", "Reorder suggestion list"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
  {
    domain: "campus operations",
    keywords: ["campus", "college", "hostel", "library", "canteen", "attendance", "event"],
    title: (i) => `Campus Resource Booking & Utilisation Map`,
    summary: (i) =>
      `Lets students book labs, projectors, and rooms, and shows utilisation — a ${i[0] ?? "campus operations"} project with visible daily use.`,
    features: ["Resource booking flow", "Conflict prevention", "Utilisation heat view", "Booking history"],
    stack: ["React", "Next.js", "Postgres", "Node"],
  },
];

function roadmapFor(weeks: number): string[] {
  const steps = [
    "requirements and scope write-up",
    "data model and API design",
    "core screens and flows",
    "main feature implementation",
    "edge cases, error handling, polish",
    "testing, demo script, defence prep",
  ];
  const chunk = Math.max(1, Math.ceil(weeks / steps.length));
  const roadmap: string[] = [];
  let week = 1;
  for (const step of steps) {
    const end = Math.min(week + chunk - 1, weeks);
    roadmap.push(`Week ${week}-${end}: ${step}`);
    week = end + 1;
    if (week > weeks) break;
  }
  return roadmap;
}

export function generateFallbackIdeas(input: GenerateInput): Idea[] {
  const interests = input.interests.map((i) => i.trim()).filter((i) => i.length > 0);
  const skills = input.skills.map((s) => s.trim()).filter((s) => s.length > 0);
  const weeks = Math.max(1, input.duration_weeks);
  const count = Math.min(Math.max(1, input.count), TEMPLATES.length);

  const interestText = interests.join(" ").toLowerCase();
  const matched = TEMPLATES.filter((t) => t.keywords.some((k) => interestText.includes(k)));
  const unmatched = TEMPLATES.filter((t) => !matched.includes(t));
  const pool = matched.length > 0 ? [...matched, ...unmatched] : TEMPLATES;

  const roadmap = roadmapFor(weeks);
  const score = 1; // fixed small constant — the model's score is the unverifiable term

  return pool.slice(0, count).map((t) => {
    const domain = t.domain;
    const interestTerm = interests.find((i) => t.keywords.some((k) => i.toLowerCase().includes(k) || k.includes(i.toLowerCase()))) ?? interests[0] ?? t.domain;
    const stack = [...new Set([...t.stack, ...(skills.length > 0 && !t.stack.some((s) => skills.some((sk) => sk.toLowerCase() === s.toLowerCase())) ? [skills[0]] : [])])];
    const skillsUsed = skills.filter((s) => stack.some((st) => st.toLowerCase() === s.toLowerCase()));

    const title = t.title(interests).slice(0, 255);

    return {
      id: deterministicId(`${t.domain}|${title}|${input.interests.join(",")}`).slice(0, 32),
      title,
      domain,
      summary: t.summary(interests),
      why_fits: `Directly uses your ${interests.join(", ") || t.domain} interest${skillsUsed.length > 0 ? ` and your existing ${skillsUsed.join(", ")} skill${skillsUsed.length > 1 ? "s" : ""}` : ""}, and is buildable in ${weeks} week${weeks > 1 ? "s" : ""} by one student.`,
      difficulty: input.difficulty,
      duration_weeks: weeks,
      score,
      features: t.features,
      stack,
      skills_used: skillsUsed,
      roadmap,
    };
  });
}

const FALLBACK_REPLIES: Record<MentorIntent, (idea: Idea) => string> = {
  scope: (idea) =>
    `Good scope question. The MVP core of "${idea.title}" is ${idea.features[0] ?? "the main feature"} and ${idea.features[1] ?? "one supporting flow"}. Everything else on the list is stretch. If time runs short, keep the first two features working end-to-end and cut the rest — a finished small scope defends far better than a broken large one.`,
  skill_gap: (idea) =>
    `A missing skill is closable, an absent interest is not \u2014 so check your motivation first. For "${idea.title}" the skills in play are ${idea.stack.join(", ")}. Start with a 45-minute tutorial on the one you are missing, then build the smallest possible vertical slice with it; that converts \u201cdon\u2019t know it\u201d into \u201clearning it with a working example\u201d in about two weeks.`,
  stack: (idea) =>
    `For "${idea.title}", the recommended stack is ${idea.stack.join(", ")}. The principle: one language for the front end, one for the server, one database. ${idea.stack[0] ?? "The first item"} is the least replaceable choice — learn that one deeply and treat the rest as utilities. If you know any of these already, keep it and swap the adjacent unfamiliar piece for something in your comfort zone.`,
  timeline: (idea) =>
    `The roadmap for "${idea.title}" is ${idea.duration_weeks} weeks: ${idea.roadmap[0] ?? "start with the scope write-up"} first, then the data layer, then the screens, then the main feature, then polish, then defence prep. The two riskiest weeks are the first and the last: scope creep at the start, and untested polish at the end. Protect the final week — nothing new after it, only verification and the demo script.`,
  viva: (idea) =>
    `Examiners will probe three things about "${idea.title}": why this problem (be ready to name the user and the pain), why this stack (each choice needs a one-line justification), and what you would do next (have one honest limitation ready). Rehearse a 90-second walkthrough: problem → design → your role → result. Confidence about the design is what examiners reward, not memorised answers.`,
  improvements: (idea) =>
    `To make "${idea.title}" stronger as a practical project: (1) Demo wow — pick the single feature that looks best live and make it flawless; ${idea.features[0] ?? "the main feature"} is your candidate. (2) Data honesty — use real (even small) datasets; examiners reward real inputs over mockups. (3) One visible measurement — a counter, a success rate, a before/after comparison makes the result feel verified. (4) Skip gold-plating — a second login flow impresses nobody; ${idea.stack[0] ?? "the core stack"} done deeply beats five features done shallowly. (5) Rehearse the failure case — know what happens when your AI or data source fails; saying it calmly is a strength.`,
  general: (idea) =>
    `About "${idea.title}": keep the demo to the strongest path — ${idea.features[0] ?? "the main feature"} shown end-to-end, ${idea.features[1] ?? "then one secondary flow"} if time allows. The specification you saved is your contract: if a question contradicts it, you may change the plan but must say so out loud. Specific questions about scope, skills, stack, timeline, or viva prep are each answered faster with the right keyword.`,
};

export function mentorFallbackReply(intent: MentorIntent, idea: Idea): string {
  return FALLBACK_REPLIES[intent](idea);
}

export function fallbackResearch(input: GenerateInput, idea: Idea): ResearchDossier {
  const weeks = Math.max(1, input.duration_weeks);
  return {
    summary: `A feasibility-and-advancement dossier for "${idea.title}" in the ${idea.domain} domain, built from the student's ${input.skills.join(", ") || "declared skills"} and a ${weeks}-week budget.`,
    market_context: [
      `The ${idea.domain} space has active open-source and commercial tooling, which means existing infrastructure can be reused rather than rebuilt.`,
      `Academic projects in this domain are judged on one working vertical slice plus a measured claim — not on breadth.`,
      `Local context matters: deployable, single-tenant tools for ${idea.domain} use-cases are scarce in university settings.`,
    ],
    existing_solutions: [
      `General-purpose platforms (the large ${idea.domain} suites) are heavyweight and unconfigurable for a semester.`,
      "Templates and boilerplate repos cover the happy path but stop at real data, real errors, and real users.",
      "DIY blog-post builds demonstrate parts but rarely ship a coherent product.",
    ],
    gap: `No existing solution combines (a) a ${idea.domain} focus, (b) the student's actual skills, and (c) a documented ${weeks}-week build order. IdeaForge's fit line already names (b); this project fills the gap by making (c) real and reviewable.`,
    advanced_features: [
      `A measured claim: one visible success metric (${idea.features[0] ?? "the core flow"} completion rate) tracked and reported.`,
      "Real (even small) data instead of mockups — a CSV, a public dataset, or hand-collected records.",
      "A failure-mode story: what happens when the AI/data source is unavailable, handled calmly.",
      "An export or share artifact (report, PDF, link) that makes the demo feel like a product.",
      "One accessibility or performance pass that examiners notice.",
    ],
    validation_plan: [
      `Weeks 1-2: define the one metric that proves "${idea.title}" works.`,
      "Weeks 3-4: build the vertical slice and measure it on real input.",
      "Mid-project: 2-3 classmates use it and report what breaks — fix the top two.",
      `Final week: rehearse the demo script and the failure case; no new features.`,
    ],
    risks: [
      `Scope creep in weeks 1-2 — the fix is the cut list from the mentor.`,
      `The data pipeline taking longer than expected — start with the smallest honest dataset.`,
      `The demo depending on a live third party — the dual-path fallback covers this.`,
    ],
  };
}

export function fallbackProjectFiles(input: GenerateInput, idea: Idea, research: ResearchDossier): ProjectFiles {
  const weeks = Math.max(1, input.duration_weeks);
  const roadmap = idea.roadmap.length > 0 ? idea.roadmap : roadmapFor(weeks);

  const prd = `# PRD — ${idea.title}

**Domain:** ${idea.domain} · **Difficulty:** ${idea.difficulty} · **Duration:** ${weeks} weeks
**Student skills:** ${input.skills.join(", ") || "to be learned"}

## Problem
${idea.summary}

## Why it fits
${idea.why_fits || "Directly uses the student's declared interests and skills."}

## Users
Final-year student (builder and primary user) · guide/examiner (reviewer of feasibility and design reasoning).

## Scope
In scope: ${idea.features.join("; ")}.
Out of scope: accounts/authentication, teams, payments, mobile apps, anything requiring background workers.

## Functional requirements
${idea.features.map((f, i) => `- FR-${i + 1}: ${f}`).join("\n")}

## Non-functional requirements
- Generation/processing completes within 20 seconds or falls back to templates.
- No unhandled server error from malformed AI output.
- Credentials live only in server-side environment variables.
- Interface usable at 375px; keyboard focus visible; reduced-motion respected.

## Acceptance criteria
1. The app loads and the form is usable.
2. Submitting interests and skills returns ranked ideas with visible fit reasons.
3. With the AI credential removed, the product still works (template engine).
4. An idea can be saved and then asked about; replies are grounded in the saved spec.
5. No credential appears in the browser network tab, page source, or console.
`;

  const brain = `# BRAIN — ${idea.title}

Design decisions log. Every choice recorded with the trade-off it accepted.

## Decisions
| # | Decision | Why | Rejected alternative |
|---|---|---|---|
| 1 | Dual-path AI: LLM first, deterministic template fallback | A live demo cannot depend on a third party; a provider failure degrades quality, never availability | LLM-only |
| 2 | Rank with visible fit reasons (0.4·model + 1.2·interest + 0.8·skill) | Explainability is a functional requirement: the student must defend the choice | Collaborative filtering (cold-start impossible) |
| 3 | Discard-on-missing-title; repair everything else | A title has no sensible default; other fields do | Auto-repair titles |
| 4 | Server-side service-role only; RLS on with zero policies | The anon key becomes inert; the server is the only writer | Client-side Supabase |
| 5 | Week-by-week roadmap scaled to the student's weeks | Feasibility is the product | Fixed generic roadmap |
| 6 | Plain text rendering, no markdown renderer | Prompt-injected markup must not execute | dangerouslySetInnerHTML |

## Open questions
- Which single metric will be reported at the viva? (decide in week 1)
- Which dataset is the honest minimum? (decide in week 2)
`;

  const architecture = `# ARCHITECTURE — ${idea.title}

**Stack:** ${idea.stack.join(", ")}

## Components
- Client: React (Vite) — form, ranked cards, fit gauge, mentor chat, research dossier, file export.
- Server: Express — validation, dual-path generation, ranking, mentor turns, dataset persistence.
- Database: Supabase Postgres — ideas, messages, generations (training data). RLS on, zero policies; only the server writes.
- AI providers (OpenAI-compatible): NVIDIA Nemotron · Gemini · Groq — ordered by user preference, deterministic fallback behind all of them.

## Data model
- ideas(id, session_id, title, domain, summary, why_fits, difficulty, duration_weeks, score, features, stack, skills_used, roadmap)
- messages(id, idea_id, session_id, role, content)
- generations(id, session_id, interests, skills, difficulty, duration_weeks, count, source, provider, ideas) — the training dataset

## API surface
- POST /api/generate — input profile → ranked ideas (source: llm | fallback)
- POST /api/research — idea → research dossier
- POST /api/project-files — idea + dossier → PRD/BRAIN/ARCHITECTURE/PLAN/PLAN-DAY
- POST /api/ideas · GET /api/ideas · POST /api/mentor · GET /api/health

## Security
- No credential is prefixed NEXT_PUBLIC_; nothing is sent to the browser.
- User-supplied Gemini key: sessionStorage only, used per request, never logged, never persisted.
- No auth and no rate limiting — stated, first fix after the deadline.
`;

  const plan = `# PLAN — ${idea.title} (${weeks} weeks)

Week-by-week build plan with milestones and checkpoints.

${roadmap.map((w) => `- ${w}`).join("\n")}

## Checkpoints
- After week 1: scope write-up + acceptance criteria finalised.
- After week 2: data model + API surface designed; dataset chosen.
- Mid-project: vertical slice working end-to-end on real input.
- One week before defence: demo script rehearsed, failure case rehearsed, no new features.

## Definition of done
- The five acceptance criteria in PRD.md all pass against the deployed URL.
- A stranger can build from this pack without asking questions.
`;

  const dayPlan = `# PLAN-DAY — ${idea.title} (${weeks} weeks, day-by-day)

${roadmap
  .map((line) => {
    const match = line.match(/Week (\d+)-(\d+): (.*)/);
    if (!match) return line;
    const [, from, to, step] = match;
    const days: string[] = [];
    const weeks = Number(to) - Number(from) + 1;
    for (let w = 0; w < weeks; w++) {
      const weekNo = Number(from) + w;
      days.push(
        `## Week ${weekNo}\n` +
          `- Day 1: research and outline for "${step}" — 1 page max\n` +
          `- Day 2: smallest working piece of "${step}"\n` +
          `- Day 3: integrate, test, fix; log one decision in BRAIN.md\n` +
          `- Day 4: polish and commit; update PLAN.md progress\n` +
          `- Day 5: buffer — review, catch-up, or viva prep\n`
      );
    }
    return days.join("\n");
  })
  .join("\n")}

## Daily rules
- Never skip Day 5 — buffer days are what make the plan survive reality.
- Every commit must leave the app running.
- Every Friday: update BRAIN.md with one decision.
`;

  return { "PRD.md": prd, "BRAIN.md": brain, "ARCHITECTURE.md": architecture, "PLAN.md": plan, "PLAN-DAY.md": dayPlan };
}