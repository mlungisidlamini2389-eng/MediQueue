import { test, expect } from "@playwright/test";

test("home login choices work on desktop and mobile", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("header").getByRole("link", { name: /sign in/i })).toHaveCount(0);
    await page.getByRole("link", { name: "Log in as Admin", exact: true }).click();
    await expect(page).toHaveURL(/#\/login\/admin$/);
    await expect(page.getByText("Use your authorised admin account to continue.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Explore the patient demo/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText("Log in as Admin", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Patient", exact: true }).click();
    await expect(page.getByRole("button", { name: /Explore the patient demo/ })).toBeVisible();
    await page.goto("/");
    await page.getByRole("link", { name: "Log in as Patient", exact: true }).click();
    await expect(page).toHaveURL(/#\/login\/patient$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("admin login redirects to the guarded admin workspace", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 401, json: { detail: "Not signed in" } }));
  await page.route("**/auth/login", route => route.fulfill({ json: { user: { id: "sample", name: "Patient", email: "patient@example.com", role: "patient" } } }));
  await page.goto("/#/login/admin");
  await page.getByLabel("Email address").fill("patient@example.com");
  await page.getByLabel("Password", { exact: true }).fill("samplepassword");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.getByRole("heading", { name: "Administrator access required." })).toBeVisible();
});
