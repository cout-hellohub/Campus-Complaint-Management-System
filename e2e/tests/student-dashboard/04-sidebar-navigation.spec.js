import { test, expect } from '@playwright/test';
import { StudentSidebarPage } from '../../src/pages/student/studentSidebar.page.js';
import { StudentDashboardPage } from '../../src/pages/student/studentDashboard.page.js';
import { loginAsStudent } from '../../utils/login.helper.js';

test.describe('Sidebar Navigation', () => {
  let sidebar;
  let dashboard;

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);

    await page.goto('http://localhost:5173/student-dashboard');
    await page.waitForLoadState('networkidle');

    sidebar = new StudentSidebarPage(page);
    dashboard = new StudentDashboardPage(page);
  });

  // VISIBILITY
  test('should display sidebar', async () => {
    await expect(sidebar.container).toBeVisible();
  });

  // NAVIGATION
  test('should navigate to home page', async ({ page }) => {
    await sidebar.goToAddComplaint();
    await expect(page).toHaveURL(/add-complaint/);

    await sidebar.goHome();
    await expect(page).toHaveURL(/student-dashboard/);
    await expect(dashboard.header).toBeVisible();
  });

  test('should navigate to Add Complaint', async ({ page }) => {
    await sidebar.goToAddComplaint();
    await expect(page).toHaveURL(/add-complaint/);
  });

  test('should navigate to My Complaints', async ({ page }) => {
    await sidebar.goToMyComplaints();
    await expect(page).toHaveURL(/my-complaints/);
  });

  test('should navigate to All Complaints', async ({ page }) => {
    await sidebar.goToAllComplaints();
    await expect(page).toHaveURL(/all-complaints/);
  });

  // ACTIVE STATES
  test('should highlight active link correctly', async () => {
    await sidebar.goToAddComplaint();

    const isActive = await sidebar.isLinkActive('sidebar-add-complaint-link');
    expect(isActive).toBeTruthy();
  });
});
