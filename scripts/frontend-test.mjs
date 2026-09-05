import { chromium } from "playwright";

const BASE = "http://localhost:5173";
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

// ---- 1. Page + help dashboard --------------------------------------------
await page.goto(BASE, { waitUntil: "networkidle" });
check("title", (await page.title()).includes("IdeaForge"));
check("h1 present", await page.getByRole("heading", { level: 1 }).isVisible());
check("help: what it does", await page.getByRole("heading", { name: "What IdeaForge does" }).isVisible());
check("help: capabilities", await page.getByRole("heading", { name: "What it is capable of" }).isVisible());
check("help: who it is for", await page.getByRole("heading", { name: "Who it is for" }).isVisible());
const caps = await page.locator(".sec li").count();
check("capability list items", caps >= 5, `got ${caps}`);
check("api key section", await page.getByRole("heading", { name: "Your own Gemini key" }).isVisible());
check("api key input", await page.getByPlaceholder("AIza… (Gemini API key, optional)").isVisible());

// ---- 2. ApiKeyField: set + clear -----------------------------------------
const keyInput = page.getByPlaceholder("AIza… (Gemini API key, optional)");
await keyInput.fill("AIzaFAKEKEY1234567890abcdef");
await page.getByRole("button", { name: "Use my key" }).click();
check("key saved status", await page.getByText("Key set — this browser session only.").isVisible());
await page.getByRole("button", { name: "Clear" }).click();
check("key cleared status", await page.getByText("No key — using the default provider (server).").isVisible());

// ---- 3. Validation: empty submit -----------------------------------------
await page.getByRole("button", { name: "Generate ideas" }).click();
await page.waitForTimeout(600);
check("empty submit shows validation error", await page.getByText("Enter at least one interest or one skill.").isVisible());

// ---- 4. Full generate flow (LLM path) ------------------------------------
await page.getByLabel("Interests").fill("healthcare, computer vision");
await page.getByLabel("Skills").fill("python, react");
await page.getByLabel("Weeks available").fill("8");
await page.getByLabel("Ideas wanted").fill("3");
await page.getByRole("button", { name: "Generate ideas" }).click();

await page.waitForSelector(".idea", { timeout: 45000 });
const cards = await page.locator(".idea").count();
check("3 idea cards rendered", cards === 3, `got ${cards}`);

const meta = await page.locator(".meta-strip").textContent();
check("meta strip names input + model", meta.includes("healthcare") && /model: groq/.test(meta ?? ""), `"${meta?.slice(0, 80)}"`);

const ranks = await page.locator(".idea-rank").allTextContents();
check("rank marks 01 02 03", JSON.stringify(ranks) === JSON.stringify(["01", "02", "03"]), JSON.stringify(ranks));

const featured = await page.locator(".idea.featured").count();
check("top pick featured", featured === 1, `got ${featured}`);

const bands = await page.locator(".fit-band").allTextContents();
check("fit bands on all cards", bands.length === 3, JSON.stringify(bands));

const matchChips = await page.locator(".chip.match").count();
check("named match chips", matchChips >= 2, `got ${matchChips}`);

check("gauge segments", (await page.locator(".gauge .seg").count()) === 36);

const stackChips = await page.locator(".idea.featured .chip:not(.match)").count();
check("stack chips on top pick", stackChips >= 2, `got ${stackChips}`);

const roadmapWeeks = await page.locator(".idea.featured .week").count();
check("roadmap weeks on top pick", roadmapWeeks >= 3, `got ${roadmapWeeks}`);

// ---- 5. Save -> calm error path (no service role key) --------------------
const saveBtn = page.getByRole("button", { name: "Save & ask mentor" }).first();
check("save button present", await saveBtn.isVisible());
await saveBtn.click();
await page.waitForTimeout(1200);
check("save failure shows calm error", await page.getByText(/could not save|could not reach the server/i).isVisible());

// ---- 6. Mobile -------------------------------------------------------------
await page.setViewportSize({ width: 375, height: 812 });
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal scroll at 375px", !hScroll);
check("generate button visible at 375px", await page.getByRole("button", { name: "Generate ideas" }).isVisible());
await page.setViewportSize({ width: 1280, height: 900 });

// ---- 7. Console audit -------------------------------------------------------
const unexpected = errors.filter((e) => !e.includes("422") && !e.includes("500"));
check("no unexpected console errors", unexpected.length === 0, JSON.stringify(unexpected.slice(0, 3)));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);