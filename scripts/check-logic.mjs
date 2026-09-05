import assert from "node:assert/strict";
import { parseJsonObject, sanitizeIdea, rankIdeas } from "../lib/sanitize.ts";
import { generateFallbackIdeas } from "../lib/fallback.ts";

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log(`PASS  ${name}`); }
  catch (err) { fail++; console.log(`FAIL  ${name}`); console.log(`      ${err.message}`); }
}

test("parse: clean object", () => assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 }));
test("parse: fenced with json tag", () => assert.deepEqual(parseJsonObject('```json\n{"ideas":[]}\n```'), { ideas: [] }));
test("parse: fenced without tag", () => assert.deepEqual(parseJsonObject('```\n{"a":2}\n```'), { a: 2 }));
test("parse: prose around object", () => assert.deepEqual(parseJsonObject('Here!\n{"a":3}\nDone.'), { a: 3 }));
test("parse: string-aware brace {\"a\":\"}\"}", () => assert.deepEqual(parseJsonObject('{"a":"}"}'), { a: "}" }));
test("parse: top-level array is null", () => assert.equal(parseJsonObject("[1,2,3]"), null));
test("parse: unbalanced braces are null", () => assert.equal(parseJsonObject('{"a":1'), null));
test("parse: empty is null", () => assert.equal(parseJsonObject(""), null));

test("sanitize: missing title -> null", () => assert.equal(sanitizeIdea({ domain: "x" }), null));
test("sanitize: whitespace title -> null", () => assert.equal(sanitizeIdea({ title: "   " }), null));
test("sanitize: ADVANCED -> advanced", () => assert.equal(sanitizeIdea({ title: "T", difficulty: "ADVANCED" }).difficulty, "advanced"));
test("sanitize: expert -> medium (default)", () => assert.equal(sanitizeIdea({ title: "T", difficulty: "expert" }).difficulty, "medium"));
test("sanitize: weeks 0 -> 6", () => assert.equal(sanitizeIdea({ title: "T", duration_weeks: 0 }).duration_weeks, 6));
test("sanitize: weeks -3 -> 6", () => assert.equal(sanitizeIdea({ title: "T", duration_weeks: -3 }).duration_weeks, 6));
test("sanitize: weeks null -> 6", () => assert.equal(sanitizeIdea({ title: "T", duration_weeks: null }).duration_weeks, 6));
test("sanitize: score 'abc' -> 0", () => assert.equal(sanitizeIdea({ title: "T", score: "abc" }).score, 0));
test("sanitize: missing domain -> general", () => assert.equal(sanitizeIdea({ title: "T" }).domain, "general"));
test("sanitize: features string -> list", () => assert.deepEqual(sanitizeIdea({ title: "T", features: "a, b, c" }).features, ["a", "b", "c"]));
test("sanitize: features numbers -> strings", () => assert.deepEqual(sanitizeIdea({ title: "T", features: [1, 2] }).features, ["1", "2"]));
test("sanitize: 300-char title -> 255", () => assert.equal(sanitizeIdea({ title: "x".repeat(300) }).title.length, 255));

const mk = (id, title) => ({ id, title, domain: "d", summary: "s", why_fits: "w", difficulty: "intermediate", duration_weeks: 8, score: 0, features: [], stack: [], skills_used: [], roadmap: [] });

test("rank: interests outrank skills (1.2 vs 0.8)", () => {
  const ranked = rankIdeas([mk("k", "react python web"), mk("i", "healthcare computer-vision screening")], ["healthcare", "computer-vision"], ["react", "python"]);
  assert.equal(ranked[0].id, "i");
});
test("rank: band thresholds", () => {
  const byId = Object.fromEntries(rankIdeas([mk("weak", "none"), mk("mod", "alpha beta"), mk("strong", "alpha beta gamma"), mk("excel", "alpha beta gamma delta epsilon")], ["alpha", "beta", "gamma", "delta", "epsilon"], []).map((i) => [i.id, i.fit.band]));
  assert.equal(byId.weak, "weak"); assert.equal(byId.mod, "moderate"); assert.equal(byId.strong, "strong"); assert.equal(byId.excel, "excellent");
});
test("rank: input not mutated", () => {
  const ideas = [mk("a", "alpha"), mk("b", "beta")];
  const before = JSON.stringify(ideas);
  rankIdeas(ideas, ["alpha"], []);
  assert.equal(JSON.stringify(ideas), before);
});

const fb = (weeks, count) => generateFallbackIdeas({ interests: [], skills: [], difficulty: "beginner", duration_weeks: weeks, count });
test("fallback: deterministic output", () => assert.deepEqual(fb(8, 3), fb(8, 3)));
test("fallback: respects count", () => assert.equal(fb(12, 2).length, 2));
test("fallback: roadmap scales with weeks", () => {
  const w4 = fb(4, 1)[0], w12 = fb(12, 1)[0];
  assert.ok(w12.roadmap.length >= w4.roadmap.length);
  assert.ok(/12/.test(w12.roadmap[w12.roadmap.length - 1]));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
