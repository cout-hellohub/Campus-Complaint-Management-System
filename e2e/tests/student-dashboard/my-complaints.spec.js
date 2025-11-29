import { test, expect } from '@playwright/test';
import { MyComplaintsPage } from '../../src/pages/student/myComplaints.page.js';
import { ComplaintDetailPage } from '../../src/pages/student/complaintDetail.page.js';
import { apiLogin } from '../../src/api/auth.api.js';
import users from '../../src/data/users.json' assert { type: 'json' };

test.describe('Student Dashboard - My Complaints', () => {
  let myComplaintsPage;
  let complaintDetailPage;

  test.beforeEach(async ({ page }) => {
    // API login and inject localStorage
    const { token, user } = await apiLogin(users.student.email, users.student.password, 'student');
    
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('ccms_token', token);
      localStorage.setItem('ccms_user', JSON.stringify(user));
    }, { token, user });

    await page.goto('http://localhost:5173/student-dashboard/my-complaints');
    await page.waitForLoadState('networkidle');

    myComplaintsPage = new MyComplaintsPage(page);
    complaintDetailPage = new ComplaintDetailPage(page);
  });

  test('should display list of user complaints', async ({ page }) => {
    // Verify page heading is loaded
    const heading = page.getByRole('heading', { name: /My Complaints/i });
    await expect(heading).toBeVisible();

    // Verify table or empty state is present
    const table = page.locator('table');
    const emptyState = page.getByText(/haven't filed any complaints|No complaints/i);
    
    // Either table exists or empty message is shown
    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    
    expect(tableVisible || emptyVisible).toBeTruthy();
  });


  test('should filter complaints by status', async ({ page }) => {
    // Wait for page to load
    await page.locator('table').or(page.getByText(/haven't filed any complaints|No complaints/i)).waitFor({ state: 'visible', timeout: 10000 });

    // Filter by "Resolved" status
    await myComplaintsPage.filterByStatus('Resolved');
    await page.waitForTimeout(1000);

    // Verify all visible rows show Resolved status
    const statusCells = page.getByTestId(/^complaint-status-/);
    const count = await statusCells.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const status = await statusCells.nth(i).textContent();
      expect(status?.trim()).toBe('Resolved');
    }
  });

  test('should filter complaints by priority', async ({ page }) => {
    // Wait for page to load
    await page.locator('table').or(page.getByText(/haven't filed any complaints|No complaints/i)).waitFor({ state: 'visible', timeout: 10000 });

    // Filter by "High" priority
    await myComplaintsPage.filterByPriority('High');
    await page.waitForTimeout(1000);

    // Verify results
    const priorityCells = page.getByTestId(/^complaint-priority-/);
    const count = await priorityCells.count();

    if (count > 0) {
      const priority = await priorityCells.first().textContent();
      expect(priority?.trim()).toBe('High');
    }
  });

    test('should sort complaints by date descending', async ({ page }) => {
    // Wait for page to load
    await page.locator('table').or(page.getByText(/haven't filed any complaints|No complaints/i)).waitFor({ state: 'visible', timeout: 10000 });

    // Click sort button
    await myComplaintsPage.sortByDate();

    // Get first 3 dates
    const dateCells = page.getByTestId(/^complaint-date-/);
    const dates = [];

    for (let i = 0; i < Math.min(3, await dateCells.count()); i++) {
      const dateText = await dateCells.nth(i).textContent();
      dates.push(new Date(dateText?.trim() || ''));
    }

    // Verify descending order
    if (dates.length >= 2) {
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    }
  });

});
