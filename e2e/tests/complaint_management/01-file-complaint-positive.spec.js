import { test, expect } from "@playwright/test";
import { apiLogin } from "../../src/api/auth.api.js";
import users from "../../src/data/users.json" assert { type: "json" };
import { AddComplaintPage } from "../../src/pages/student/addComplaint.page.js";
import { fileComplaintFlow } from "../../src/flows/fileComplaintFlow.js";

test.describe("File Complaint - POSITIVE FLOW", () => {

  test.beforeEach(async ({ page }) => {
    // Login via API
    const { token, user } = await apiLogin(
      users.student.email,
      users.student.password,
      "student"
    );

    // Inject authentication into browser
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem("ccms_token", token);
      localStorage.setItem("ccms_user", JSON.stringify(user));
    }, { token, user });

    // Navigate to Add Complaint page
    await page.goto("http://localhost:5173/student-dashboard/add-complaint");
  });

  test("should submit a valid complaint successfully", async ({ page }) => {
    test.setTimeout(20000); // 10 seconds for file upload + submission
    const addComplaintPage = new AddComplaintPage(page);

    const result = await fileComplaintFlow(page, addComplaintPage, {
      title: "Water leakage in hostel bathroom",
      description:
        "There is continuous water leakage in the 2nd-floor bathroom. The floor becomes slippery and dangerous. Issue ongoing for 3 days. Hostel A - 2nd Floor Bathroom",
      type: "Public",
      isAnonymous: false,
      files: ["e2e/src/data/test-files/image-2MB.jpg"],
    });

    // Validate complaint ID format
    expect(result.complaintId).toMatch(/^CC[A-Z0-9]{6}$/);

    // Validate committee is provided
    expect(result.committee.length).toBeGreaterThan(2);

    // Click "View My Complaints"
    await page.getByTestId("view-complaints-button").click();

    await expect(page).toHaveURL("/student-dashboard/my-complaints");
  });
});
