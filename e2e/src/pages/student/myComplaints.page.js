import { BaseComplaintsTablePage } from './_baseComplaintsTable.page.js';

export class MyComplaintsPage extends BaseComplaintsTablePage {
  constructor(page) {
    super(page);
  }

  get pageTitle() { 
    return this.getTestId('my-complaints-page-title'); 
  }

  get filterPanel() { 
    return this.getTestId('filter-panel'); 
  }

  getEditButton(rowIndex) {
    return this.getComplaintRowByIndex(rowIndex).getByTestId('complaint-edit-btn');
  }

  getWithdrawButton(rowIndex) {
    return this.getComplaintRowByIndex(rowIndex).getByTestId('complaint-withdraw-btn');
  }

  async clickEdit(rowIndex) {
    await this.getEditButton(rowIndex).click();
  }

  async clickWithdraw(rowIndex) {
    await this.getWithdrawButton(rowIndex).click();
  }

  async pageTitleText() {
    return this.pageTitle.textContent();
  }

  async isFilterPanelVisible() {
    return this.filterPanel.isVisible();
  }

  async isEditButtonVisible(rowIndex) {
    return this.getEditButton(rowIndex).isVisible();
  }

  async isWithdrawButtonVisible(rowIndex) {
    return this.getWithdrawButton(rowIndex).isVisible();
  }
  async filterByStatus(status) {
    // Click filter button (button with filter SVG icon) - it's the button with the filter funnel SVG
    const filterButton = this.page.locator('button').filter({ 
      has: this.page.locator('svg path[d*="M3 3a1"]') 
    }).first();
    await filterButton.click();
    
    // Wait for modal to appear
    await this.page.waitForTimeout(500);
    
    // Find and click the status checkbox label
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    const statusLabel = this.page.locator('label').filter({ hasText: statusText });
    await statusLabel.click();
    
    // Click Apply Filters button
    await this.page.getByRole('button', { name: 'Apply Filters' }).click();
  }

  async filterByPriority(priority) {
    // Click filter button (button with filter SVG icon)
    const filterButton = this.page.locator('button').filter({ 
      has: this.page.locator('svg path[d*="M3 3a1"]') 
    }).first();
    await filterButton.click();
    
    // Wait for modal to appear
    await this.page.waitForTimeout(500);
    
    // Find and click the priority checkbox label
    const priorityLabel = this.page.locator('label').filter({ hasText: new RegExp(`^${priority}$`) });
    await priorityLabel.click();
    
    // Click Apply Filters button
    await this.page.getByRole('button', { name: 'Apply Filters' }).click();
  }

  async sortByDate() {
    // The sort is a select dropdown
    const sortSelect = this.page.locator('select');
    await sortSelect.selectOption('createdAt-descending');
  }
}
