// import { test, expect } from "@playwright/test";
// import { apiLogin } from "../../src/api/auth.api.js";
// import users from "../../src/data/users.json" assert { type: "json" };
// import { AddComplaintPage } from "../../src/pages/student/addComplaint.page.js";
// import { MyComplaintsPage } from "../../src/pages/student/myComplaints.page.js";
// import { fileComplaintFlow } from "../../src/flows/fileComplaintFlow.js";

// test.describe("Complaint Workflow - FULL INTEGRATED REGRESSION", () => {

//   test.beforeEach(async ({ page }) => {
//     const { token, user } = await apiLogin(
//       users.student.email,
//       users.student.password,
//       "student"
//     );

//     await page.addInitScript(({ token, user }) => {
//       localStorage.setItem("ccms_token", token);
//       localStorage.setItem("ccms_user", JSON.stringify(user));
//     }, { token, user });
//   });

//   // -----------------------------------------------------------
//   // 1. FULL FLOW: File → Success Modal → Redirect → Table Entry
//   // -----------------------------------------------------------
//   test("should file complaint and verify it appears in My Complaints", async ({ page }) => {
//     const addPage = new AddComplaintPage(page);

//     // Go to add complaint page
//     await page.goto("http://localhost:5173/student-dashboard/add-complaint");

//     // File complaint (real flow)
//     const { complaintId, committee } = await fileComplaintFlow(page, addPage, {
//       title: "Integrated Test Issue",
//       description:
//         "This is a full regression scenario to ensure complaint creation, routing, and table visibility. Integration Block 1",
//       type: "Public",
//       files: ["e2e/src/data/test-files/image-2MB.jpg"],
//     });

//     // Go to My Complaints
//     await page.getByTestId("view-complaints-button").click();
//     await expect(page).toHaveURL("http://localhost:5173/student-dashboard/my-complaints");

//     const myPage = new MyComplaintsPage(page);

//     // New complaint row should exist
//     const row = page.getByTestId(`complaint-row-${complaintId}`);
//     await expect(row).toBeVisible();

//     // Check basic values
//     await expect(row.getByTestId(`complaint-title-${complaintId}`)).toContainText("Integrated Test Issue");
//     await expect(row.getByTestId(`complaint-committee-${complaintId}`)).toContainText(committee);
//   });

//   // -----------------------------------------------------------
//   // 2. OPEN COMPLAINT → VERIFY DETAIL PAGE → BACK WORKS
//   // -----------------------------------------------------------
//   test("should open complaint detail and return back to table", async ({ page }) => {
//     await page.goto("http://localhost:5173/student-dashboard/my-complaints");

//     const myPage = new MyComplaintsPage(page);

//     // Wait for table
//     await expect(page.getByTestId("complaints-table")).toBeVisible();

//     // Click first row
//     const firstRow = page.getByTestId(/^complaint-row-/).first();
//     const complaintId = await firstRow.getAttribute("data-complaint-id");

//     await firstRow.click();
//     await page.waitForURL(`**/complaint-detail/${complaintId}`);

//     // Verify detail page
//     await expect(page.getByTestId("complaint-detail-title")).toBeVisible();

//     // Click back
//     await page.getByTestId("detail-back-btn").click();
//     await expect(page).toHaveURL("**/my-complaints");
//   });

//   // -----------------------------------------------------------
//   // 3. VERIFY ANONYMOUS COMPLAINTS BEHAVE CORRECTLY
//   // -----------------------------------------------------------
//   test("should create anonymous complaint and verify anonymity on table & detail", async ({ page }) => {
//     const addPage = new AddComplaintPage(page);

//     await page.goto("http://localhost:5173/student-dashboard/add-complaint");

//     const { complaintId } = await fileComplaintFlow(page, addPage, {
//       title: "Anonymous Issue",
//       description: "Testing anonymous complaint creation through integrated regression.",
//       type: "Public",
//       isAnonymous: true,
//     });

//     await page.getByTestId("view-complaints-button").click();
//     await expect(page).toHaveURL("http://localhost:5173/student-dashboard/my-complaints");

//     const row = page.getByTestId(`complaint-row-${complaintId}`);
//     await expect(row).toBeVisible();

//     // Anonymity label in table
//     await expect(row.getByTestId(`complaint-anonymous-${complaintId}`)).toBeVisible();

//     // Detail page also should show anonymous tag
//     await row.click();
//     await expect(page.getByTestId("complaint-detail-anonymous-tag")).toBeVisible();
//   });

//   // -----------------------------------------------------------
//   // 4. CATEGORY / PRIORITY IS SET BY AI ROUTING
//   // -----------------------------------------------------------
//   test("should verify AI-assigned committee present in table", async ({ page }) => {
//     const addPage = new AddComplaintPage(page);

//     await page.goto("http://localhost:5173/student-dashboard/add-complaint");

//     const { complaintId } = await fileComplaintFlow(page, addPage, {
//       title: "Gym wires broken",
//       description: "Gym equipment cable snapped and treadmill wire damaged.",
//       type: "Public",
//     });

//     await page.getByTestId("view-complaints-button").click();

//     // Table row
//     const row = page.getByTestId(`complaint-row-${complaintId}`);
//     await expect(row).toBeVisible();

//     // Check category (committee assigned)
//     await expect(row.locator('[data-testid^="complaint-committee"]')).toBeVisible();
//   });

  

// });
