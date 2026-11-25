import { defineConfig } from "@playwright/test";

/**
 * Two projects:
 *  - unit: pure TypeScript helpers, no browser or server needed (`npm run test:unit`, runs in CI).
 *  - e2e:  full-stack browser tests against a running app (`npm run test:e2e`). Needs the backend + `npm run dev`
 *          (or the Docker stack) and an admin account: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 *          Set PW_CHANNEL=msedge or chrome to use an installed browser instead of `npx playwright install`.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  reporter: [["list"]],
  projects: [
    { name: "unit", testMatch: /unit\/.*\.spec\.ts/ },
    {
      name: "e2e",
      testMatch: /e2e\/.*\.spec\.ts/,
      fullyParallel: false,
      use: {
        baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
        channel: process.env.PW_CHANNEL || undefined,
        headless: true,
      },
    },
  ],
});
