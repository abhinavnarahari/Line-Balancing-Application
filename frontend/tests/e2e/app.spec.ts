import { expect, test } from "@playwright/test";
import { ADMIN, api, signIn } from "./helpers";

const ROUTES = [
  "/", "/plant-dashboard", "/line-dashboard", "/settings/shifts", "/settings/lines", "/settings/machines",
  "/settings/operators", "/settings/operations", "/settings/sizes", "/settings/styles", "/settings/users",
  "/shift-assignment", "/attendance", "/immediate-actions", "/skill-matrix", "/skill-matrix/logs", "/orders",
  "/operation-bulletins", "/capacity-planning", "/line-design", "/operator-allocation", "/line-balance",
  "/fixed-shift-target", "/operator-placement", "/monitoring",
];

test.beforeEach(async ({ page }) => {
  await signIn(page, ADMIN);
});

test("every route renders without JS errors, server errors or load-failure toasts", async ({ page }) => {
  test.setTimeout(240_000); // ~25 routes, each waits for network idle
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`JS error: ${e.message.split("\n")[0]}`));
  page.on("response", (r) => {
    if (r.url().includes("/api/") && (r.status() >= 500 || r.status() === 401 || r.status() === 403)) {
      problems.push(`${r.status()} ${r.url()}`);
    }
  });
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });
    if (await page.getByText(/could not be loaded/).count()) problems.push(`load-failure toast on ${route}`);
  }
  expect(problems).toEqual([]);
});

test("shared dialog is accessible: labelled, focus trapped, Escape closes, focus restored", async ({ page }) => {
  await page.goto("/settings/users");
  await page.getByRole("button", { name: "Add User" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add User Account" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("#user-email")).toBeFocused();
  for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add User" }).first()).toBeFocused();
});

test("released bulletins are locked; revisions are editable and use optimistic locking", async ({ page }) => {
  const before = (await api(page, "/operation-bulletins")).body.data as { id: number; status: string }[];
  test.skip(!before.some((b) => b.status === "RELEASED" || b.status === "PUBLISHED"), "needs a released bulletin");

  await page.goto("/operation-bulletins");
  await page.getByRole("button", { name: "Create revision" }).first().click();
  await expect(page.getByText(/created as DRAFT/)).toBeVisible();

  const after = (await api(page, "/operation-bulletins")).body.data as { id: number }[];
  const created = after.filter((a) => !before.some((b) => b.id === a.id));
  expect(created).toHaveLength(1);
  try {
    const detail = (await api(page, `/operation-bulletins/${created[0].id}`)).body.data;
    const saved = await api(page, `/operation-bulletins/${created[0].id}`, { method: "PUT", body: { ...detail, description: "e2e edit" } });
    expect(saved.status).toBe(200);
    expect(saved.body.data.rowVersion).toBe(detail.rowVersion + 1);
    const stale = await api(page, `/operation-bulletins/${created[0].id}`, { method: "PUT", body: { ...detail, description: "stale" } });
    expect(stale.status).toBe(409);
  } finally {
    for (const c of created) await api(page, `/operation-bulletins/${c.id}`, { method: "DELETE" });
  }
});

test("duplicate sewing line code is reported inside the form, which stays open", async ({ page }) => {
  const lines = (await api(page, "/lines")).body.data as { lineCode: string }[];
  test.skip(lines.length === 0, "needs a sewing line");
  await page.goto("/settings/lines");
  await page.getByRole("button", { name: /add|new|register/i }).first().click();
  await page.locator('input[name="lineCode"]').fill(lines[0].lineCode);
  await page.locator('input[name="lineName"]').fill("Duplicate E2E Line");
  await page.getByRole("button", { name: /Register Sewing Line/ }).click();
  await expect(page.locator('form [role="alert"]')).toContainText("already exists");
  await expect(page.locator('input[name="lineCode"]')).toBeVisible();
});

test("piece entry survives a background refresh triggered by window focus", async ({ page }) => {
  await page.goto("/monitoring");
  await page.getByText("Log Piece Run").click();
  const qty = page.locator('input[type="number"]').first();
  await qty.fill("77");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForTimeout(3000);
  await expect(qty).toHaveValue("77");
});
