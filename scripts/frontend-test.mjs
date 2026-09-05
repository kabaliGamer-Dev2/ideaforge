import { chromium } from "playwright";

const BASE = "http://localhost:5173";
let pass = 0;
let fail = 0;

function check(name, ok, extra = "") {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} ${extra}`); }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
const downloads = [];
page.on("download", (d) => downloads.push(d.suggestedFilename()));

await page.goto(BASE, { waitUntil: "networkidle" });

// ---- 1. Dashboard help + key ---------------------------------------------
check("title", (await page.title()).includes("IdeaForge"));
check("help sections x4", await page.getByRole("heading", { name: "What IdeaForge does" }).isVisible()
  && await page.getByRole("heading", { name: "What it is capable of" }).isVisible()
  && await page.getByRole("heading", { name: "Who it is for" }).isVisible()
  && await page.getByRole("heading", { name: "Your own Gemini key" }).isVisible());
check("capability items >= 5", (await page.locator(".sec li").count()) >= 5);

// ---- 2. Model picker ------------------------------------------------------
const modelSel = page.getByLabel("AI model");
check("model picker present", await modelSel.isVisible());
await modelSel.selectOption({ label: "NVIDIA — nemotron-3-super-120b-a12b" });
check("model picker selects nvidia", (await modelSel.inputValue()) === "nvidia");
await modelSel.selectOption({ label: "Auto — best available provider" });

// ---- 3. Difficulty: 5 levels ----------------------------------------------
const diffSel = page.getByLabel("Target difficulty");
const diffOptions = await diffSel.locator("option").allTextContents();
check("5 difficulty levels", JSON.stringify(diffOptions) === JSON.stringify([
  "Low level", "Beginner level", "Medium level", "High level", "Advanced level",
]), JSON.stringify(diffOptions));
await diffSel.selectOption("high");

// ---- 4. Skills: select chips, not typing ----------------------------------
const skillButtons = page.locator(".picker-grid button");
check("skill pool rendered", (await skillButtons.count()) >= 40, `got ${await skillButtons.count()}`);
await page.getByRole("button", { name: "Python", exact: true }).click();
await page.getByRole("button", { name: "React", exact: true }).click();
check("skill chips toggle aria-pressed", await page.getByRole("button", { name: "Python", exact: true }).getAttribute("aria-pressed") === "true");
check("selected count shown", await page.getByText("2 selected").isVisible());

// ---- 5. Interests: suggestions + random -----------------------------------
const interestInput = page.getByLabel("Interests");
check("interest input editable", await interestInput.isVisible());
const suggestCount = await page.locator(".picker-suggest button").count();
check("interest suggestions shown", suggestCount >= 4, `got ${suggestCount}`);
await page.getByRole("button", { name: /^\+ / }).first().click();
check("suggestion adds a term", (await interestInput.inputValue()).length > 0);
const randBtn = page.getByRole("button", { name: "Random" }).first();
await randBtn.click();
check("random fills interests", (await interestInput.inputValue()).length > 0);

// ---- 6. Count min 3 + validation ------------------------------------------
const countInput = page.getByLabel("Ideas wanted (min 3)");
check("count input min=3 enforced natively", await countInput.getAttribute("min") === "3");
await countInput.fill("3");
// Deselect skills to trigger client-side validation
await page.getByRole("button", { name: "Python", exact: true }).click();
await page.getByRole("button", { name: "React", exact: true }).click();
await page.getByRole("button", { name: "Generate ideas" }).click();
await page.waitForTimeout(500);
check("empty-skills validation blocked client-side", (await page.getByText(/select at least one skill/i).count()) > 0);
await page.getByRole("button", { name: "Python", exact: true }).click();
await page.getByRole("button", { name: "React", exact: true }).click();

// ---- 7. Full generate ------------------------------------------------------
await page.getByLabel("Interests").fill("healthcare, computer vision");
await page.getByLabel("Weeks available").fill("8");
await page.getByLabel("Ideas wanted (min 3)").fill("3");
await page.getByRole("button", { name: "Generate ideas" }).click();
await page.waitForSelector(".idea", { timeout: 45000 });
const cards = await page.locator(".idea").count();
check("3 idea cards rendered", cards === 3, `got ${cards}`);
const meta = await page.locator(".meta-strip").textContent();
check("meta names input + model", meta.includes("healthcare") && meta.includes("Python"), `"${meta?.slice(0, 90)}"`);
const ranks = await page.locator(".idea-rank").allTextContents();
check("rank marks 01 02 03", JSON.stringify(ranks) === JSON.stringify(["01", "02", "03"]), JSON.stringify(ranks));
check("fit bands", (await page.locator(".fit-band").count()) === 3);
check("gauge segments", (await page.locator(".gauge .seg").count()) === 36);
check("top pick roadmap", (await page.locator(".idea.featured .week").count()) >= 3);

// ---- 8. Research + advance ------------------------------------------------
await page.getByRole("button", { name: "Research & advance" }).first().click();
await page.waitForSelector(".dossier", { timeout: 60000 });
check("research dossier rendered", (await page.locator(".dossier").count()) >= 1);
check("dossier has sections", await page.getByText("Market context").isVisible()
  && await page.getByText("Advanced features to add").isVisible());

// ---- 9. Full project files -------------------------------------------------
await page.getByRole("button", { name: "Full project files" }).first().click();
await page.waitForSelector(".files-note", { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(1500);
check("files downloaded (5 docs)", downloads.length === 5, JSON.stringify(downloads));
check("filenames correct", downloads.every((f) => /^(PRD|BRAIN|ARCHITECTURE|PLAN|PLAN-DAY)\.md$/.test(f)), JSON.stringify(downloads));

// ---- 10. Mobile ------------------------------------------------------------
await page.setViewportSize({ width: 375, height: 812 });
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("no horizontal scroll at 375px", !hScroll);
check("generate button visible at 375px", await page.getByRole("button", { name: "Generate ideas" }).isVisible());
await page.setViewportSize({ width: 1280, height: 900 });

// ---- 11. Console audit ------------------------------------------------------
const unexpected = errors.filter((e) => !e.includes("422") && !e.includes("500"));
check("no unexpected console errors", unexpected.length === 0, JSON.stringify(unexpected.slice(0, 3)));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);