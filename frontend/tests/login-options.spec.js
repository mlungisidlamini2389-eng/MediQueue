import { test, expect } from "@playwright/test";

test("admin uses only a password and can retry an incorrect password", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/auth/admin/login", route => {
    const payload = route.request().postDataJSON();
    expect(Object.keys(payload)).toEqual(["password"]);
    return payload.password === "Admin@"
      ? route.fulfill({ json: { user: { id: "admin", name: "Admin", role: "admin" } } })
      : route.fulfill({ status: 401, json: { detail: "Admin password is incorrect." } });
  });
  await page.route("**/admin/consultations", route => route.fulfill({ json: [] }));
  await page.goto("/#/login/admin");
  await expect(page.getByLabel("Email address")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Admin password is incorrect.");
  await page.getByLabel("Password", { exact: true }).fill("Admin@");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.getByRole("link", { name: "Admin review" })).toBeVisible();
});

test("home login choices work on desktop and mobile", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("header").getByRole("link", { name: /sign in/i })).toHaveCount(0);
    await page.getByRole("link", { name: "Log in as Admin", exact: true }).click();
    await expect(page).toHaveURL(/#\/login\/admin$/);
    await expect(page.getByText("Enter your admin password to continue.")).toBeVisible();
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
