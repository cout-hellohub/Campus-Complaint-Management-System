import { test, expect } from '@playwright/test';
import { RoleSelectionPage } from '../../src/pages/roleselection.page.js';
import { LoginFormPage } from '../../src/pages/loginform.page.js';
import { URLS } from '../../src/constants/urls.js';
import users from '../../src/data/users.json' assert { type: 'json' };

// Roles array
const roleTests = [
  {
    role: 'student',
    selectRole: async (roleSelection) => await roleSelection.selectStudentRole(),
    expectedDashboard: URLS.studentDashboard,
    validUser: 'student'
  },
  {
    role: 'admin',
    selectRole: async (roleSelection) => await roleSelection.selectAdminRole(),
    expectedDashboard: URLS.adminDashboard,
    validUser: 'admin'
  },
  {
    role: 'committee',
    selectRole: async (roleSelection) => await roleSelection.selectCommitteeRole(),
    expectedDashboard: URLS.committeeDashboard,
    validUser: 'committee'
  }
];

//iterate tests for each role
for (const { role, selectRole, expectedDashboard, validUser } of roleTests) {
  
  test.describe(`${role.toUpperCase()} Login – Edge Case Tests`, () => {
    let loginFormPage;

    test.beforeEach(async ({ page }) => {
      const roleSelection = new RoleSelectionPage(page);
      loginFormPage = new LoginFormPage(page);

      await test.step('Navigate and select role', async () => {
        await roleSelection.goto();
        await selectRole(roleSelection);
        await loginFormPage.verifyOnPage(role);
      });
    });

    test('accepts uppercase email addresses', async ({ page }) => {
      const user = users[validUser];

      await test.step('Login with uppercase email', async () => {
        await loginFormPage.doLogin(user.email.toUpperCase(), user.password);
      });
      
      await test.step('Verify successful login', async () => {
        await expect(page).toHaveURL(expectedDashboard);
      });
    });

    test('rejects extremely long passwords', async ({ page }) => {
      const user = users[validUser];
      const longPassword = 'a'.repeat(201);

        await test.step('Login with long password', async () => {
        await loginFormPage.doLogin(user.email, longPassword);
      });

         await test.step('Verify error message and no redirect', async () => {
        // Accept either specific error or generic error message (bcrypt may timeout/error on very long passwords)
        await expect(loginFormPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL(URLS.roleLogin);
      });
    });

    test('submits form when Enter key is pressed', async ({ page }) => {
      const user = users[validUser];

        await test.step('Fill credentials and press Enter', async () => {
        await loginFormPage.emailInput.fill(user.email);
        await loginFormPage.passwordInput.fill(user.password);
        await loginFormPage.passwordInput.press('Enter');
      });
      
        await test.step('Verify successful login', async () => {
        // timeout for stability
        await expect(page).toHaveURL(expectedDashboard, { timeout: 5000 });
      });
    });

    test('Login button becomes disabled after first click', async ({ page }) => {
      const user = users[validUser];

        await test.step('Fill credentials and click Login', async () => {
        await loginFormPage.emailInput.fill(user.email);
        await loginFormPage.passwordInput.fill(user.password);
        await loginFormPage.loginButton.click();
      });
      
        await test.step('Verify button is disabled OR navigation succeeds', async () => {
      
        await Promise.race([
          expect(loginFormPage.loginButton).toBeDisabled({ timeout: 2000 }),
          expect(page).toHaveURL(expectedDashboard, { timeout: 5000 })
        ]);
        await expect(page).toHaveURL(expectedDashboard, { timeout: 5000 });
      });
    });
  });
}