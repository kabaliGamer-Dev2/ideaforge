import assert from "node:assert/strict";
import { parseJsonObject, sanitizeIdea, rankIdeas } from "../lib/sanitize.ts";
import { generateFallbackIdeas } from "../lib/fallback.ts";

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    fail++;
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
  }
}

// ---- parseJsonObject -----------------------------------------------------
test("parse: clean object", () => {
  assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
});

test("parse: fenced with json tag", () => {
  const t = '```json\n{"ideas":[]}\n```';
  assert.deepEqual(parseJsonObject(t), { ideas: [] });
});

test("parse: fenced without tag", () => {
  const t = '```\n{"a":2}\n```';
  assert.deepEqual(parseJsonObject(t), { a: 2 });
});

test("parse: prose before and after the object", () => {
  const t = 'Here you go!\n{"a":3}\nHope that helps.';
  assert.deepEqual(parseJsonObject(t), { a: 3 });
});

test("parse: string-aware brace case {\"a\":\"}\"}", () => {
  assert.deepEqual(parseJsonObject('{"a":"}"}'), { a: "}" });
});

test("parse: top-level array is null", () => {
  assert.equal(parseJsonObject("[1,2,3]"), null);
});

test("parse: unbalanced braces are null", () => {
  assert.equal(parseJsonObject('{"a":1'), null);
});

test("parse: empty string is null", () => {
  assert.equal(parseJsonObject(""), null);
});

// ---- sanitizeIdea --------------------------------------------------------
test("sanitize: missing title -> null", () => {
  assert.equal(sanitizeIdea({ domain: "x" }), null);
});

test("sanitize: whitespace-only title -> null", () => {
  assert.equal(sanitizeIdea({ title: "   " }), null);
});

test("sanitize: ADVANCED -> advanced", () => {
  const idea = sanitizeIdea({ title: "T", difficulty: "ADVANCED" });
  assert.equal(idea.difficulty, "advanced");
});

test("sanitize: expert -> intermediate", () => {
  const idea = sanitizeIdea({ title: "T", difficulty: "expert" });
  assert.equal(idea.difficulty, "intermediate");
});

test("sanitize: weeks 0 -> 6", () => {
  const idea = sanitizeIdea({ title: "T", duration_weeks: 0 });
  assert.equal(idea.duration_weeks, 6);
});

test("sanitize: weeks -3 -> 6", () => {
  const idea = sanitizeIdea({ title: "T", duration_weeks: -3 });
  assert.equal(idea.duration_weeks, 6);
});

test("sanitize: weeks null -> 6", () => {
  const idea = sanitizeIdea({ title: "T", duration_weeks: null });
  assert.equal(idea.duration_weeks, 6);
});

test("sanitize: score 'abc' -> 0", () => {
  const idea = sanitizeIdea({ title: "T", score: "abc" });
  assert.equal(idea.score, 0);
});

test("sanitize: missing domain -> general", () => {
  const idea = sanitizeIdea({ title: "T" });
  assert.equal(idea.domain, "general");
});

test("sanitize: features 'a, b, c' -> [a,b,c]", () => {
  const idea = sanitizeIdea({ title: "T", features: "a, b, c" });
  assert.deepEqual(idea.features, ["a", "b", "c"]);
});

test("sanitize: features [1,2] -> ['1','2']", () => {
  const idea = sanitizeIdea({ title: "T", features: [1, 2] });
  assert.deepEqual(idea.features, ["1", "2"]);
});

test("sanitize: 300-char title truncated to 255", () => {
  const idea = sanitizeIdea({ title: "x".repeat(300) });
  assert.equal(idea.title.length, 255);
});

// ---- rankIdeas -----------------------------------------------------------
test("rank: two-interest idea outranks two-skill idea (1.2 vs 0.8)", () => {
  const base = {
    id: "x", title: "t", domain: "d", summary: "s", why_fits: "w",
    difficulty: "intermediate", duration_weeks: 8, score: 0,
    features: [], stack: [], skills_used: [], roadmap: [],
  };
  const interestIdea = { ...base, id: "i", title: "healthcare computer-vision screening" };
  const skillIdea = { ...base, id: "k", title: "react python web platform" };
  const ranked = rankIdeas([skillIdea, interestIdea], ["healthcare", "computer-vision"], ["react", "python"]);
  assert.equal(ranked[0].id, "i");
});

test("rank: band thresholds (0 weak, 1-2 moderate, 3-4 strong, 5+ excellent)", () => {
  const mk = (id, title) => ({
    id, title, domain: "d", summary: "s", why_fits: "w",
    difficulty: "intermediate", duration_weeks: 8, score: 0,
    features: [], stack: [], skills_used: [], roadmap: [],
  });
  const ideas = [mk("weak", "no overlap here"), mk("mod", "alpha beta"), mk("strong", "alpha beta gamma"), mk("excel", "alpha beta gamma delta epsilon")];
  const ranked = rankIdeas(ideas, ["alpha", "beta", "gamma", "delta", "epsilon"], []);
  const byId = Object.fromEntries(ranked.map((i) => [i.id, i.fit.band]));
  assert.equal(byId.weak, "weak");
  assert.equal(byId.mod, "moderate");
  assert.equal(byId.strong, "strong");
  assert.equal(byId.excel, "excellent");
});

test("rank: input not mutated", () => {
  const mk = (id, title) => ({
    id, title, domain: "d", summary: "s", why_fits: "w",
    difficulty: "intermediate", duration_weeks: 8, score: 0,
    features: [], stack: [], skills_used: [], roadmap: [],
  });
  const ideas = [mk("a", "alpha"), mk("b", "beta")];
  const before = JSON.stringify(ideas);
  rankIdeas(ideas, ["alpha"], []);
  assert.equal(JSON.stringify(ideas), before);
});

// ---- generateFallbackIdeas ----------------------------------------------
test("fallback: same input twice -> deep-equal output", () => {
  const input = {
    interests: ["healthcare"], skills: ["react"], difficulty: "intermediate",
    duration_weeks: 8, count: 3,
  };
  const a = generateFallbackIdeas(input);
  const b = generateFallbackIdeas(input);
  assert.deepEqual(a, b);
});

test("fallback: respects count", () => {
  const input = {
    interests: [], skills: [], difficulty: "beginner",
    duration_weeks: 12, count: 2,
  };
  assert.equal(generateFallbackIdeas(input).length, 2);
});

test("fallback: roadmap length scales with duration_weeks", () => {
  const mk = (weeks) => generateFallbackIdeas({
    interests: [], skills: [], difficulty: "beginner", duration_weeks: weeks, count: 1,
  })[0];
  const w4 = mk(4), w12 = mk(12);
  assert.ok(w12.roadmap.length >= w4.roadmap.length, "longer duration -> more roadmap entries");
  const last = w12.roadmap[w12.roadmap.length - 1];
  assert.ok(last.startsWith(`Week ${Math.min(11, 12)}-${12}`) || /12/.test(last), "roadmap covers final week");
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);