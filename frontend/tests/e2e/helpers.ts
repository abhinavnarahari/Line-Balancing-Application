import { expect, type Page } from "@playwright/test";

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "admin@sewnexa.local",
  password: process.env.E2E_ADMIN_PASSWORD || "",
};

/** Fixed supervisor account reused by every run (created or reset by ensureSupervisor). */
export const SUPERVISOR = { email: "e2e.supervisor@test.local", password: "Supervisor2026" };

export async function signIn(page: Page, user: { email: string; password: string }) {
  expect(user.password, "set E2E_ADMIN_PASSWORD").not.toBe("");
  await page.goto("/login");
  await page.fill("#login-email", user.email);
  await page.fill("#login-password", user.password);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 20_000 });
}

/** Same-origin API call from the signed-in page (sends the session cookie and CSRF header). */
export async function api(page: Page, path: string, init: { method?: string; body?: unknown } = {}) {
  return page.evaluate(
    async ([p, method, body]) => {
      const xsrf = document.cookie.split("; ").find((c) => c.startsWith("XSRF-TOKEN="))?.split("=")[1] ?? "";
      const r = await fetch("/api" + p, {
        method: method || "GET",
        headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": xsrf },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    [path, init.method, init.body] as const,
  );
}

/** Create the e2e supervisor if missing, otherwise reactivate it and reset its password. Needs an admin page. */
export async function ensureSupervisor(adminPage: Page) {
  const users = (await api(adminPage, "/users")).body.data as { id: number; email: string }[];
  const existing = users.find((u) => u.email === SUPERVISOR.email);
  if (!existing) {
    const r = await api(adminPage, "/users", {
      method: "POST",
      body: { email: SUPERVISOR.email, fullName: "E2E Supervisor", role: "LINE_SUPERVISOR", password: SUPERVISOR.password },
    });
    expect(r.status).toBe(201);
  } else {
    await api(adminPage, `/users/${existing.id}`, {
      method: "PUT",
      body: { fullName: "E2E Supervisor", role: "LINE_SUPERVISOR", active: true },
    });
    await api(adminPage, `/users/${existing.id}/reset-password`, { method: "POST", body: { newPassword: SUPERVISOR.password } });
  }
}
