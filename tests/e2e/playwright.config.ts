import { defineConfig } from "@playwright/test";

const PAPERCLIP_PORT = Number(process.env.PAPERCLIP_PORT ?? 3199);
const MNEMEBRAIN_PORT = Number(process.env.MNEMEBRAIN_PORT ?? 8000);

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  timeout: 120_000,
  retries: 0,
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: `http://127.0.0.1:${PAPERCLIP_PORT}`,
    extraHTTPHeaders: {
      "X-MnemeBrain-URL": `http://127.0.0.1:${MNEMEBRAIN_PORT}`,
    },
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      use: { browserName: "chromium" },
    },
  ],
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./playwright-report" }]],
});
