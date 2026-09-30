import { test, expect } from "@playwright/test";

test("confirmed date requests SMS and email and shows their actual status", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ json: { user: { id: "patient", name: "Example Patient", email: "patient@example.com", mobile: "+27821234567", role: "patient" } } }));
  await page.route("**/consultations/mine/latest", route => route.fulfill({ json: { id: "consultation", symptoms: ["Headache"], duration: "Today", impact: "Mild", history: "", medicines: "", notes: "", appointment: null } }));
  await page.route("**/appointments/offers?*", route => route.fulfill({ json: [{ id: "offer", starts_at: "2030-01-10T08:00:00Z", department: "General", location: "Main reception" }] }));
  await page.route("**/appointments/offers/offer/select", route => {
    expect(route.request().postDataJSON()).toEqual({ mobile: "+27821234567" });
    return route.fulfill({ json: { id: "appointment", starts_at: "2030-01-10T08:00:00Z", department: "General", location: "Main reception", status: "confirmed", notifications: { sms: "not_configured", email: "accepted" } } });
  });
  await page.goto("/#/appointment");
  await expect(page.getByLabel("Mobile number for confirmation SMS")).toHaveValue("+27821234567");
  await expect(page.getByText("patient@example.com", { exact: true })).toBeVisible();
  await page.locator(".slot-button").click();
  await expect(page.getByRole("heading", { name: "Appointment confirmed", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Not sent. The messaging service is not connected yet.", { exact: false })).toBeVisible();
  await expect(page.getByText("Submitted for delivery.", { exact: false })).toBeVisible();
});

test("registration sends the provided mobile number to the backend", async ({ page }) => {
  await page.route("**/auth/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/consultations/mine/latest", route => route.fulfill({ json: null }));
  await page.route("**/auth/register", route => {
    expect(route.request().postDataJSON().mobile).toBe("0821234567");
    return route.fulfill({ json: { user: { id: "patient", name: "Example", email: "patient@example.com", mobile: "+27821234567", role: "patient" } } });
  });
  await page.goto("/#/register");
  await page.getByLabel("Full name").fill("Example");
  await page.getByLabel("Email address").fill("patient@example.com");
  await page.getByLabel("Mobile number", { exact: true }).fill("0821234567");
  await page.getByLabel("Password", { exact: true }).fill("example-password");
  await page.getByLabel("Confirm password").fill("example-password");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);
});
