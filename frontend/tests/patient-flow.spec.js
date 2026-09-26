import { test, expect } from "@playwright/test";

test("landing, Google setup state and complete patient demo", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Less time in line/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Start pre-consultation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Explore the patient demo/ }).click();
  await page
    .getByRole("link", { name: "Start pre-consultation", exact: true })
    .click();
  await page.getByLabel("When did this start?").selectOption("Today");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Select at least one symptom to continue.",
  );
  await page.getByLabel("Headache", { exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("How much is this affecting your day?")
    .selectOption("Some activities are difficult");
  await page.getByLabel(/Existing conditions/).fill("Sample allergy");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Additional symptoms or concerns")
    .fill("Sample concern for the demo.");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "sample.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC7sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(
    page.getByAltText("Selected attachment: sample.png"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove sample.png" }).click();
  await expect(
    page.getByAltText("Selected attachment: sample.png"),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Review information" }).click();
  await expect(
    page.getByText("Sample concern for the demo.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview appointment" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Preview appointment" }).click();
  await expect(
    page.getByText("Demo only · no appointment has been booked"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to my dashboard" }).click();
  await expect(
    page.getByRole("link", { name: "View your pre-consultation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit demo" }).click();
  await page.goto("/#/review");
  await expect(
    page.getByRole("heading", { name: "Welcome to MediQueue" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile navigation, section links and page widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveURL(/#\/how-it-works$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await page.goto("/#/login");
  await expect(
    page.getByRole("heading", { name: "Welcome to MediQueue" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Explore the patient demo/ }).click();
  await page
    .getByRole("link", { name: "Start pre-consultation", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/consultation-mobile.png",
    fullPage: true,
  });
});
