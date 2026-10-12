import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5181", trace: "retain-on-failure", contextOptions: { reducedMotion: "reduce" } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npx vite --port 5181 --strictPort", url: "http://localhost:5181", reuseExistingServer: true, timeout: 60_000 },
});
