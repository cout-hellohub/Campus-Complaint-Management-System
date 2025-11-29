import { test, expect } from "@playwright/test";
import { apiLogin } from "../../src/api/auth.api.js";
import users from "../../src/data/users.json" assert { type: "json" };
import { AddComplaintPage } from "../../src/pages/student/addComplaint.page.js";

test.describe("Complaint Form - API VALIDATION", () => {

  test.beforeEach(async ({ page }) => {
    const { token, user } = await apiLogin(
      users.student.email,
      users.student.password,
      "student"
    );

    await page.addInitScript(({ token, user }) => {
      localStorage.setItem("ccms_token", token);
      localStorage.setItem("ccms_user", JSON.stringify(user));
    }, { token, user });

    await page.goto("http://localhost:5173/student-dashboard/add-complaint");
  });

  // ---------------------------------------------------------------
  // 1) FORCE BACKEND 400 ERROR (bad payload)
  // ---------------------------------------------------------------
  test("should show API error when backend rejects invalid payload (400)", async ({ page }) => {
    const addPage = new AddComplaintPage(page);

    // Fill valid-looking fields but inject invalid payload through JS
    await addPage.fillTitle("Valid Title");
    await addPage.fillDescription("Valid description with enough length to pass UI rules.");

    // Intercept request and modify payload
    await page.route("**/complaints/create", (route, request) => {
      const form = request.postData();
      // Force backend failure
      route.fulfill({
        status: 400,
        body: JSON.stringify({ message: "Invalid payload: category missing" })
      });
    });

    await addPage.submit();

    // Expect API error modal to appear
    await expect(page.getByTestId("error-container")).toBeVisible();
    await expect(page.getByTestId("error-list")).toContainText("Invalid payload");
  });

  // ---------------------------------------------------------------
  // 2) FORCE BACKEND 500 ERROR (server crash)
  // ---------------------------------------------------------------
  test("should show fallback error message on server 500", async ({ page }) => {
    const addPage = new AddComplaintPage(page);

    await addPage.fillTitle("Test Server Crash");
    await addPage.fillDescription("Valid description for backend crash test");

    await page.route("**/complaints/create", route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: "Server crashed" })
      });
    });

    await addPage.submit();

    await expect(page.getByTestId("error-container")).toBeVisible();
    await expect(page.getByTestId("error-list")).toContainText("Server crashed");
  });

  // ---------------------------------------------------------------
  // 3) FORCE TIMEOUT (LangChain/Gemini slow)
  // ---------------------------------------------------------------
  test("should handle LangChain/Gemini timeout gracefully", async ({ page }) => {
    const addPage = new AddComplaintPage(page);

    await addPage.fillTitle("WiFi issue");
    await addPage.fillDescription("Description long enough but slow AI response expected.");

    // Delay 25 seconds to simulate timeout
    await page.route("**/complaints/create", async route => {
      await new Promise(res => setTimeout(res, 10000)); // fake LLM timeout
      route.fulfill({
        status: 408,
        body: JSON.stringify({ message: "AI routing timeout" })
      });
    });

    await addPage.submit();

    await expect(page.getByTestId("error-container")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("error-list")).toContainText("timeout");
  });


});
