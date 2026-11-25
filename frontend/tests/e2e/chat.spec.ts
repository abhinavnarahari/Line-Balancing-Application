import { expect, test } from "@playwright/test";
import { ADMIN, api, signIn } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page, ADMIN);
});

test("SewNexa AI answers from application data and cites its source", async ({ page }) => {
  const operators = (await api(page, "/operators")).body.data as unknown[];

  await page.goto("/");
  await page.getByTitle("Open SewNexa AI").click();
  // starter questions are loaded from the backend
  await expect(page.getByRole("tablist", { name: "Question categories" })).toBeVisible();

  const input = page.getByPlaceholder(/Ask SewNexa/);
  await input.fill("How many operators are there?");
  await input.press("Enter");
  const answer = page.getByText(/Source: /).last();
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(new RegExp(`\\b${operators.length}\\b.*operators`)).last()).toBeVisible();

  await input.fill("What is the capital of France?");
  await input.press("Enter");
  await expect(page.getByText(/I can only help with/).last()).toBeVisible({ timeout: 20_000 });
});
