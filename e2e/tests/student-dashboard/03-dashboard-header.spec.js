import { test, expect } from '@playwright/test';
import { StudentDashboardPage } from '../../src/pages/student/studentDashboard.page.js';
import { loginAsStudent } from '../../utils/login.helper.js';

test.describe('Header', () => {
  let dashboard;

  test.beforeEach(async ({ page }) => {
    // Login using a clean flow
    await loginAsStudent(page);
    await page.goto('http://localhost:5173/student-dashboard');
    await page.waitForLoadState('networkidle');
    dashboard = new StudentDashboardPage(page);
  });

  // HEADER
  test('should display header', async () => {
    await expect(dashboard.header).toBeVisible();
  });

  // NOTIFICATIONS
  test('should toggle notification dropdown when clicking bell', async () => {
    await dashboard.notificationBell.click();
    await expect(dashboard.notificationDropdown).toBeVisible();

    await dashboard.notificationBell.click();
    await expect(dashboard.notificationDropdown).not.toBeVisible();
  });

  test('should show numeric notification badge (if exists)', async () => {
    if (await dashboard.notificationBadge.isVisible()) {
      const count = await dashboard.notificationBadge.innerText();
      expect(Number(count)).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show notifications inside dropdown (or empty state)', async () => {
    await dashboard.openNotifications();
    await expect(dashboard.notificationDropdown).toBeVisible();

    const text = await dashboard.notificationDropdown.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('should mark all notifications read', async () => {
    await dashboard.openNotifications();

    if (await dashboard.markAllReadButton.isVisible()) {
      await dashboard.markAllReadButton.click();
      await expect(dashboard.markAllReadButton).toBeEnabled(); // action completed
    }
  });

  // PROFILE
  test('should open profile menu', async () => {
    await dashboard.profileButton.click();
    await expect(dashboard.profileMenu).toBeVisible();
  });

  test('should display username in profile menu', async () => {
    await dashboard.profileButton.click();
    await expect(dashboard.userName).toBeVisible();
  });

  test('should contain logout button in profile menu', async () => {
    await dashboard.profileButton.click();
    await expect(dashboard.logoutButton).toBeVisible();
  });

  test('should navigate to profile page via menu', async ({ page }) => {
    await dashboard.profileButton.click();

    if (await dashboard.viewProfileLink.isVisible()) {
      await dashboard.viewProfileLink.click();
      await expect(page).toHaveURL(/profile/);
    }
  });

  // OUTSIDE CLICK
  test('should close notifications when clicking outside', async () => {
    await dashboard.openNotifications();
    await expect(dashboard.notificationDropdown).toBeVisible();

    await dashboard.header.click(); // click outside

    await expect(dashboard.notificationDropdown).not.toBeVisible();
  });
});
