import type { GenerateInput, Idea, MentorIntent } from "./types.ts";
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
    `A missing skill is closable, an absent interest is not — so check your motivation first. For "${idea.title}" the skills in play are ${idea.stack.join(", ")}. Start with a 45-minute tutorial on the one you are missing, then build the smallest possible vertical slice with it; that converts "don't know it" into "learning it with a working example" in about two weeks.`,
  stack: (idea) =>
    `For "${idea.title}", the recommended stack is ${idea.stack.join(", ")}. The principle: one language for the front end, one for the server, one database. ${idea.stack[0] ?? "The first item"} is the least replaceable choice — learn that one deeply and treat the rest as utilities. If you know any of these already, keep it and swap the adjacent unfamiliar piece for something in your comfort zone.`,
  timeline: (idea) =>
    `The roadmap for "${idea.title}" is ${idea.duration_weeks} weeks: ${idea.roadmap[0] ?? "start with the scope write-up"} first, then the data layer, then the screens, then the main feature, then polish, then defence prep. The two riskiest weeks are the first and the last: scope creep at the start, and untested polish at the end. Protect the final week — nothing new after it, only verification and the demo script.`,
  viva: (idea) =>
    `Examiners will probe three things about "${idea.title}": why this problem (be ready to name the user and the pain), why this stack (each choice needs a one-line justification), and what you would do next (have one honest limitation ready). Rehearse a 90-second walkthrough: problem → design → your role → result. Confidence about the design is what examiners reward, not memorised answers.`,
  general: (idea) =>
    `About "${idea.title}": keep the demo to the strongest path — ${idea.features[0] ?? "the main feature"} shown end-to-end, ${idea.features[1] ?? "then one secondary flow"} if time allows. The specification you saved is your contract: if a question contradicts it, you may change the plan but must say so out loud. Specific questions about scope, skills, stack, timeline, or viva prep are each answered faster with the right keyword.`,
};

export function mentorFallbackReply(intent: MentorIntent, idea: Idea): string {
  return FALLBACK_REPLIES[intent](idea);
}