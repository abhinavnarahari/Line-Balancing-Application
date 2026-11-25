import { expect, test } from "@playwright/test";
import { ADMIN, SUPERVISOR, api, ensureSupervisor, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("unauthenticated deep link redirects to login", async ({ page }) => {
  await page.goto("/monitoring");
  await expect(page).toHaveURL(/\/login$/);
});

test("wrong password shows the server message and stores nothing locally", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#login-email", ADMIN.email);
  await page.fill("#login-password", "WrongPass99");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("alert")).toContainText("Invalid email or password");
  expect(await page.evaluate(() => localStorage.getItem("sewnexa_auth_user"))).toBeNull();
});

test("admin session uses an HttpOnly cookie and survives reload", async ({ page, context }) => {
  await signIn(page, ADMIN);
  const session = (await context.cookies()).find((c) => c.name === "SEWNEXA_SESSION");
  expect(session?.httpOnly).toBe(true);
  await page.goto("/settings/users");
  await page.reload();
  await expect(page).toHaveURL(/\/settings\/users$/);
  await ensureSupervisor(page);
});

test("supervisor can record floor data but not change masters or manage users", async ({ page }) => {
  await signIn(page, SUPERVISOR);
  await expect(page).toHaveURL(/\/monitoring$/);
  await page.goto("/settings/users");
  await expect(page).not.toHaveURL(/\/settings\/users$/);
  expect((await api(page, "/sizes", { method: "POST", body: {} })).status).toBe(403);
  expect((await api(page, "/attendance", { method: "POST", body: {} })).status).toBe(400); // allowed; fails validation
});

test("logout ends the session and clears per-user storage", async ({ page }) => {
  await signIn(page, SUPERVISOR);
  await page.evaluate(() => localStorage.setItem("sewnexa_applied_bulletin_scenario_last_applied", "x"));
  await page.locator('button[title="User profile"]').click();
  await page.getByText("Sign Out of SewNexa").click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await api(page, "/auth/me")).status).toBe(401);
  expect(await page.evaluate(() => localStorage.getItem("sewnexa_applied_bulletin_scenario_last_applied"))).toBeNull();
});
