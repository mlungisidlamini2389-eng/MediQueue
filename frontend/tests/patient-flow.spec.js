import { test, expect } from "@playwright/test";

test("landing and complete patient demo", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Log in as Admin" }),
  ).toBeVisible();
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
  ).toHaveCount(0);
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
  await page.getByLabel("Choose photos").setInputFiles({
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
    page.getByRole("heading", { name: "Patient-reported summary" }),
  ).toBeVisible();
  await expect(page.getByText(/The patient reports Headache/)).toBeVisible();
  await expect(page.getByText(/does not diagnose a condition/)).toBeVisible();
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

test("admin review displays the stored summary and original responses", async ({
  page,
}) => {
  const summary =
    "The patient reports Headache. The reported onset is Today, and the reported daily impact is Some activities are difficult.\n\nConditions or allergies reported: Sample allergy. No current medicines were included in the responses. No additional concerns were included in the responses.\n\nThis summary is based only on the patient's responses. It does not diagnose a condition or recommend treatment. A healthcare professional should review this summary and the original responses.";
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "admin-test",
          name: "Care Admin",
          email: "admin@example.com",
          role: "admin",
        },
      }),
    }),
  );
  await page.route("**/admin/consultations", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "consultation-test",
          patient: { name: "Sample Patient", email: "patient@example.com" },
          symptoms: ["Headache"],
          duration: "Today",
          impact: "Some activities are difficult",
          history: "Sample allergy",
          medicines: "",
          notes: "",
          summary,
          created_at: "2026-09-30 10:00:00",
          images: [],
          offers: [],
        },
      ]),
    }),
  );
  await page.goto("/#/admin");
  await expect(
    page.getByRole("heading", { name: "Sample Patient" }),
  ).toBeVisible();
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  await expect(page.getByText("Headache", { exact: true })).toBeVisible();
  await expect(page.getByText("Sample allergy", { exact: true })).toBeVisible();
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
