import { expect, test, type Page } from "@playwright/test";

// App-level behaviour: no login, local progress, privacy controls, fallbacks.

async function fast(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __SOUNDSTEPS_FAST__: boolean }).__SOUNDSTEPS_FAST__ = true;
  });
}

async function finishFirstLesson(page: Page) {
  await page.goto("/#/lesson/l0-listen");
  for (let i = 0; i < 40 && !(await page.locator("[data-celebration]").count()); i++) {
    const next = page.getByRole("button", { name: /^(Next|Done) ▶$/ });
    if (await next.count()) await next.click();
    else await page.locator('[data-correct="true"]').first().click();
  }
  await expect(page.locator("[data-celebration]")).toBeVisible();
}

test("opens straight to the learning path with no login", async ({ page }) => {
  await fast(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "SoundSteps", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Learning" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Level 0: Meet the Sounds/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Level 2: Blend Sounds. Locked/ })).toBeVisible();
  await expect(page.getByText(/log ?in|sign ?up|password|email/i)).toHaveCount(0);
});

test("remembers progress on this device and offers Continue", async ({ page }) => {
  await fast(page);
  await finishFirstLesson(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Continue:/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /^Continue:/ })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem("soundsteps:v1:progress"));
  expect(stored).toContain("l0-listen");
});

test("reset progress clears everything", async ({ page }) => {
  await fast(page);
  await finishFirstLesson(page);
  await page.goto("/#/grown-ups");
  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.getByRole("button", { name: "Yes, reset" }).click();
  await expect(page.getByRole("status")).toHaveText("Progress cleared.");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start Learning" })).toBeVisible();
});

test("'don't save progress' mode keeps nothing in storage", async ({ page }) => {
  await fast(page);
  await page.goto("/#/grown-ups");
  await page.getByLabel(/Save progress on this device/).uncheck();
  await finishFirstLesson(page);
  expect(await page.evaluate(() => localStorage.getItem("soundsteps:v1:progress"))).toBeNull();
});

test("works when the browser blocks storage", async ({ page }) => {
  await fast(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await finishFirstLesson(page);
  await page.goto("/#/grown-ups");
  await expect(page.getByText(/blocking storage/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("accent setting changes which recordings play", async ({ page }) => {
  await fast(page);
  await page.goto("/#/grown-ups");
  await page.getByText("British English").click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("soundsteps:v1:settings")!).accent);
  expect(stored).toBe("gb");
  const res = await page.request.get("/audio/gb/ph/s.m4a");
  expect(res.ok()).toBe(true);
});

test("locked levels explain how to open them", async ({ page }) => {
  await fast(page);
  await page.goto("/#/level/5");
  await expect(page.getByText("Finish level 4 to open this level.")).toBeVisible();
});

test("unknown pages show a friendly message", async ({ page }) => {
  await page.goto("/#/nope");
  await expect(page.getByText("This page went for a walk")).toBeVisible();
  await page.getByRole("link", { name: "Go home" }).click();
  await expect(page.getByRole("heading", { name: "SoundSteps", exact: true })).toBeVisible();
});
