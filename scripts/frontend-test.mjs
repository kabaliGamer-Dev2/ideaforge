import { chromium } from "playwright";

const BASE = "http://localhost:3000";
let pass = 0;
let fail = 0;

function check(name, ok, extra = "") {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} ${extra}`); }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

// ---- 1. Page loads -------------------------------------------------------
await page.goto(BASE, { waitUntil: "networkidle" });
check("page loads", (await page.title()).includes("IdeaForge"));
check("h1 present", await page.getByRole("heading", { level: 1 }).isVisible());
check("kicker present", await page.getByText("capstone project advisor").isVisible());
check("form fields present", await page.getByLabel("Interests").isVisible() && await page.getByLabel("Skills").isVisible());
check("weeks + count inputs", await page.getByLabel("Weeks available").isVisible() && await page.getByLabel("Ideas wanted").isVisible());
check("difficulty select", await page.getByLabel("Target difficulty").isVisible());

// ---- 2. Validation: empty submit -> 422 message --------------------------
await page.getByRole("button", { name: "Generate ideas" }).click();
await page.waitForTimeout(600);
const errText = await page.getByText("Enter at least one interest or one skill.").isVisible().catch(() => false);
check("empty submit shows validation error", errText);

// ---- 3. Full generate flow (LLM path) ------------------------------------
await page.getByLabel("Interests").fill("healthcare, computer vision");
await page.getByLabel("Skills").fill("python, react");
await page.getByLabel("Weeks available").fill("8");
await page.getByLabel("Ideas wanted").fill("3");
await page.getByRole("button", { name: "Generate ideas" }).click();

await page.waitForSelector("article.cell", { timeout: 45000 });
const cards = await page.locator("article.cell").count();
check("3 idea cards rendered", cards === 3, `got ${cards}`);

const meta = await page.locator(".meta-strip").textContent();
check("meta strip names the input", meta.includes("healthcare") && meta.includes("python"), `"${meta?.slice(0, 60)}"`);

const ranks = await page.locator(".idea-rank").allTextContents();
check("rank marks 01 02 03", JSON.stringify(ranks) === JSON.stringify(["01", "02", "03"]), JSON.stringify(ranks));

const topWide = await page.locator("article.cell.span-wide").count();
check("top pick is the wide cell", topWide === 1, `wide cells: ${topWide}`);

const bands = await page.locator(".fit-band").allTextContents();
check("fit bands shown on all cards", bands.length === 3, JSON.stringify(bands));

const matchChips = await page.locator(".chip.match").count();
check("named match chips visible", matchChips >= 2, `chips: ${matchChips}`);

check("gauge segments rendered", (await page.locator(".gauge .seg").count()) === 36);

const stackChips = await page.locator("article.cell.span-wide .chip:not(.match)").count();
check("stack chips on top pick", stackChips >= 2, `got ${stackChips}`);

const roadmapWeeks = await page.locator("article.cell.span-wide .week").count();
check("roadmap weeks on top pick", roadmapWeeks >= 3, `got ${roadmapWeeks}`);

// ---- 4. Save button -> error path (no service role key) ------------------
const saveBtn = page.getByRole("button", { name: "Save & ask mentor" }).first();
check("save button present", await saveBtn.isVisible());
await saveBtn.click();
await page.waitForTimeout(1200);
const saveErr = await page.getByText(/could not save|could not reach the server/i).isVisible().catch(() => false);
check("save failure shows calm error (no key configured)", saveErr);

// ---- 5. Fallback notice sanity (LLM source, so notice absent) ------------
const fbNotice = await page.getByText("Generated offline from templates").count();
check("no fallback notice on LLM path", fbNotice === 0);

// ---- 6. Mobile viewport ---------------------------------------------------
await page.setViewportSize({ width: 375, height: 812 });
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal scroll at 375px", !hScroll);
const btnOk = await page.getByRole("button", { name: "Generate ideas" }).isVisible();
check("generate button still visible at 375px", btnOk);
await page.setViewportSize({ width: 1280, height: 900 });

// ---- 7. Console / network audit -------------------------------------------
// 422 (validation test) and 500 (save-without-key) are expected error paths.
const unexpected = errors.filter((e) => !e.includes("422") && !e.includes("500"));
check("no unexpected console errors", unexpected.length === 0, JSON.stringify(unexpected.slice(0, 3)));
const failedReqs = await page.evaluate(() => performance.getEntriesByType("resource").filter(r => r.name.startsWith(location.origin)).length);
check("resources loaded", failedReqs >= 3, `count ${failedReqs}`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);