import { test, expect } from "@playwright/test";

test("authenticated consultation, admin offer and persistent booking", async ({
  page,
}) => {
  const email = `patient-${Date.now()}@example.com`;
  const password = "patient-password";

  const unauthorized = await page.request.get(
    "http://127.0.0.1:8000/admin/consultations",
  );
  expect(unauthorized.status()).toBe(401);

  await page.goto("/#/register");
  await page.getByLabel("Full name").fill("E2E Patient");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("0712345678");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);

  await page
    .getByRole("link", { name: "Start pre-consultation", exact: true })
    .click();
  await page.getByLabel("Headache", { exact: true }).check();
  await page.getByLabel("When did this start?").selectOption("Today");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("How much is this affecting your day?")
    .selectOption("Some activities are difficult");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Additional symptoms or concerns")
    .fill("Authenticated E2E concern");
  await page.getByLabel("Choose photos").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVR4nGMU0bBhYGBgYgADAAWiAHylyrQdAAAAAElFTkSuQmCC",
      "base64",
    ),
  });
  await page.getByRole("link", { name: "Review information" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit pre-consultation" }).click();
  await expect(
    page.getByText("No appointment options have been sent yet."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Leave session" }).click();
  await page.waitForFunction(() => window.location.hash === "#/");
  await page.goto("/#/login/admin");
  await page.getByLabel("Email address").fill("e2e-admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("e2e-admin-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/#\/admin$/);

  const consultation = page
    .locator("article.admin-consultation")
    .filter({ hasText: email });
  await expect(consultation).toContainText("Authenticated E2E concern");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const followingDay = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const localValue = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  await consultation
    .getByLabel("Appointment option 1 for E2E Patient")
    .fill(localValue(tomorrow));
  await consultation
    .getByLabel("Appointment option 2 for E2E Patient")
    .fill(localValue(followingDay));
  await consultation
    .getByRole("button", { name: "Send dates to patient" })
    .click();
  await expect(
    page.getByText("Appointment options sent to the patient."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Leave session" }).click();
  await page.waitForFunction(() => window.location.hash === "#/");
  await page.goto("/#/login/patient");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "View appointment options" }).click();
  await expect(page.locator(".slot-button")).toHaveCount(2);
  await page.locator(".slot-button").first().click();
  await expect(
    page.getByRole("heading", { name: "Appointment confirmed" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Your appointment is confirmed", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to my dashboard" }).click();
  await expect(
    page.getByText("Your appointment is confirmed", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Your appointment is confirmed", { exact: true }),
  ).toBeVisible();
  await page.goto("/#/appointment");
  await expect(
    page.getByText("Your appointment is confirmed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".slot-button")).toHaveCount(0);

  await page.getByRole("button", { name: "Leave session" }).click();
  await page.waitForFunction(() => window.location.hash === "#/");
  await page.goto("/#/login/patient");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Your appointment is confirmed", { exact: true }),
  ).toBeVisible();
});
