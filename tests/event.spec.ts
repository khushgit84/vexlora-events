import { test, expect } from "@playwright/test";
import { seedTestEvent, TEST_EMAIL, TEST_PASSWORD, EVENT_SLUG } from "./seed";

test.describe("Vexlora Events E2E", () => {
  let eventId: string;

  test.beforeAll(async () => {
    // Requires .env.local variables to be loaded
    require("dotenv").config({ path: ".env.local" });
    const data = await seedTestEvent();
    eventId = data.eventId;
  });

  test("Participant registers and organizer can view stats", async ({ page, context }) => {
    const participantEmail = `john${Date.now()}@example.com`;
    // 1. Participant Registration
    await page.goto(`/e/${EVENT_SLUG}`);
    await expect(page.getByRole("heading", { name: "E2E Test Event" })).toBeVisible();
    
    await page.getByLabel("Full name").fill("John Doe");
    await page.getByLabel("Email").fill(participantEmail);
    await page.getByLabel("College").fill("Test College");
    await page.getByRole("button", { name: "Register" }).click();
    
    // Should see QR ticket
    await expect(page.getByRole("heading", { name: "John Doe" })).toBeVisible();
    await expect(page.getByText("Show this QR code at the entry desk")).toBeVisible();
    
    // Grab the QR token from the URL or just continue
    // 2. Organizer logs in
    const orgPage = await context.newPage();
    await orgPage.goto("/login");
    await orgPage.getByLabel("Email").fill(TEST_EMAIL);
    await orgPage.getByLabel("Password").fill(TEST_PASSWORD);
    await orgPage.getByRole("button", { name: "Log in" }).click();
    
    // Dashboard should load
    await orgPage.waitForURL("**/dashboard*");
    await expect(orgPage.getByRole("heading", { name: "E2E Testing Org" })).toBeVisible();

    // 3. Organizer views participant
    await orgPage.goto(`/dashboard/${eventId}/participants`);
    await expect(orgPage.getByRole("cell", { name: "John Doe" })).toBeVisible({ timeout: 15000 });
    await expect(orgPage.getByRole("cell", { name: participantEmail })).toBeVisible({ timeout: 15000 });

    // 4. Dashboard Sponsor Report
    await orgPage.goto(`/dashboard/${eventId}`);
    const reportLink = await orgPage.getByRole("link", { name: "Open sponsor report" }).getAttribute("href");
    expect(reportLink).toBeTruthy();

    const reportPage = await context.newPage();
    await reportPage.goto(reportLink!);
    await expect(reportPage.getByRole("heading", { name: "E2E Test Event" })).toBeVisible();
    await expect(reportPage.getByText("Students registered")).toBeVisible();
  });
});
