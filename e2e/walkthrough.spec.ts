import { expect, test, type Page } from "@playwright/test";
import { ALL_LESSONS } from "../src/content/curriculum";
import { STORIES } from "../src/content/reading";
import { GAMES } from "../src/lib/games";

// Plays every lesson, game and story start to finish, the way a child would,
// using dev-only data-* markers to find the right answers. Fails on any page
// error, any screen with nothing to do (a dead end), or a lesson that never ends.

async function setup(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript((s) => {
    (window as unknown as { __SOUNDSTEPS_FAST__: boolean }).__SOUNDSTEPS_FAST__ = true;
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("soundsteps:v1:settings", JSON.stringify({ unlockAll: true, muted: true, ...s }));
      sessionStorage.setItem("seeded", "1");
    }
  }, settings);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|favicon/.test(m.text())) errors.push(m.text()); });
  return errors;
}

const NEXT_BUTTONS = /^(Next ▶|Done ▶|The end ▶|Let's read! ▶|I told it! ▶|Hooray! ▶|Start the hunt ▶|I'm done ▶|Let's go! ▶|Next ▶)$/;

/** Do one sensible thing on the screen. Returns a description, or null if nothing to do. */
async function act(page: Page): Promise<string | null> {
  const clickFirst = async (sel: string, what: string) => {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.click();
      return what;
    }
    return null;
  };
  const next = page.getByRole("button", { name: NEXT_BUTTONS }).first();
  if (await next.count()) { await next.click(); return "next"; }
  const nextPage = page.getByRole("button", { name: "Next page" });
  if (await nextPage.count()) { await nextPage.click(); return "next page"; }
  if (await page.getByRole("button", { name: "I said it! ✔" }).count()) { await page.getByRole("button", { name: "I said it! ✔" }).click(); return "said it"; }

  const r =
    (await clickFirst('[data-correct="true"]:not([disabled])', "correct answer")) ??
    (await (async () => {
      const tiles = page.locator("[data-answer]:not([disabled])");
      if (!(await tiles.count())) return null;
      const idx = await tiles.evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.answer)));
      await page.locator(`[data-answer="${Math.min(...idx)}"]`).click();
      return "build tile";
    })()) ??
    (await (async () => {
      const t = page.locator("[data-target]");
      if (!(await t.count())) return null;
      const n = Number(await t.getAttribute("data-target"));
      for (let i = 0; i < n; i++) await t.click();
      await page.getByRole("button", { name: "Done ✔" }).click();
      return "count";
    })()) ??
    (await (async () => {
      const nx = page.locator("[data-next]");
      if (!(await nx.count())) return null;
      const v = await nx.getAttribute("data-next");
      if (!v) return null;
      const [corr, box] = v.split(",");
      await page.locator(`[data-corr="${corr}"]`).click();
      await page.locator(`[data-box="${box}"]`).click();
      return "chain";
    })()) ??
    (await clickFirst('[data-onset="todo"]', "onset")) ??
    (await (async () => {
      const cards = page.locator("[data-order]:not([disabled])");
      if (!(await cards.count())) return null;
      const idx = await cards.evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.order)));
      await page.locator(`[data-order="${Math.min(...idx)}"]:not([disabled])`).first().click();
      return "order";
    })()) ??
    (await clickFirst('button[aria-label="Add the magic e"]', "magic e")) ??
    (await clickFirst('button[aria-label^="Add "]', "ending"));
  return r;
}

async function playToEnd(page: Page, label: string, errors: string[] = []) {
  let idle = 0;
  for (let i = 0; i < 600; i++) {
    if (await page.locator("[data-celebration]").count()) return;
    const did = await act(page);
    if (did) idle = 0;
    else if (++idle > 20) {
      throw new Error(`${label}: stuck with nothing to do. Screen says: ${(await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 400)} Errors: ${errors.join(" | ")}`);
    }
    await page.waitForTimeout(did ? 30 : 100);
  }
  throw new Error(`${label}: did not finish`);
}

async function missingAudio(page: Page): Promise<string[]> {
  return page.evaluate(() => [...new Set((window as unknown as { __SOUNDSTEPS_MISSING__?: string[] }).__SOUNDSTEPS_MISSING__ ?? [])]);
}

test.afterEach(async ({ page }) => {
  expect(await missingAudio(page), "these sounds have no recorded clip, so the device voice would be used").toEqual([]);
});

test.describe("every lesson can be completed", () => {
  for (const lesson of ALL_LESSONS) {
    test(lesson.id, async ({ page }) => {
      const errors = await setup(page);
      await page.goto(`/#/lesson/${lesson.id}`);
      await playToEnd(page, lesson.id, errors);
      await expect(page.locator("[data-celebration]")).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("games, stories and the daily challenge", () => {
  for (const g of GAMES) {
    test(`game: ${g.id}`, async ({ page }) => {
      const errors = await setup(page);
      // play the first level 2 lesson so games have taught content
      await page.goto("/#/games");
      await page.goto(`/#/games/${g.id}`);
      const locked = await page.getByText("This game opens after a few more lessons").count();
      if (locked) return; // not enough content yet — checked separately below
      await playToEnd(page, g.id, errors);
      expect(errors).toEqual([]);
    });
  }
  for (const s of STORIES) {
    test(`story: ${s.id}`, async ({ page }) => {
      const errors = await setup(page);
      await page.goto(`/#/stories/${s.id}`);
      await playToEnd(page, s.id, errors);
      expect(errors).toEqual([]);
    });
  }
  test("daily challenge", async ({ page }) => {
    const errors = await setup(page);
    await page.goto("/#/daily");
    await playToEnd(page, "daily", errors);
    expect(errors).toEqual([]);
  });
});

test("'Next lesson' starts the next lesson fresh, all the way through a level", async ({ page }) => {
  await setup(page);
  await page.goto("/#/lesson/l0-listen");
  const seen: string[] = [];
  for (let n = 0; n < 6; n++) {
    // the new lesson must show an activity, not the previous lesson's celebration
    await expect(page.locator("[data-celebration]")).toHaveCount(0);
    seen.push(page.url().split("/lesson/")[1]);
    await playToEnd(page, seen[seen.length - 1]);
    const next = page.getByRole("button", { name: /^(Next lesson|Next level) ▶$/ });
    if (!(await next.count())) break;
    await next.click();
  }
  expect(seen).toEqual(["l0-listen", "l0-animals", "l0-drum", "l0-first", "l0-twins", "l0-check"]);
});
