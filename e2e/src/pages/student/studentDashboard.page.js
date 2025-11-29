import { BasePage } from '../_base.page.js';

export class StudentDashboardPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // ========= HEADER =========

  get header()            { return this.getTestId('dashboard-header'); }
  get title()             { return this.getTestId('dashboard-title'); }

  // ========= STAT CARDS =========

  get totalCard()         { return this.getTestId('dashboard-card-total'); }
  get resolvedCard()      { return this.getTestId('dashboard-card-resolved'); }
  get inProgressCard()    { return this.getTestId('dashboard-card-inprogress'); }
  get pendingCard()       { return this.getTestId('dashboard-card-pending'); }

  get totalValue()        { return this.getTestId('dashboard-card-total-value'); }
  get resolvedValue()     { return this.getTestId('dashboard-card-resolved-value'); }
  get inProgressValue()   { return this.getTestId('dashboard-card-inprogress-value'); }
  get pendingValue()      { return this.getTestId('dashboard-card-pending-value'); }

  // ========= NOTIFICATIONS =========

  get notificationBell()      { return this.getTestId('notification-bell-button'); }
  get notificationBadge()     { return this.getTestId('notification-badge'); }
  get notificationDropdown()  { return this.getTestId('notification-dropdown'); }
  get markAllReadButton()     { return this.getTestId('mark-all-read-button'); }

  // ========= PROFILE =========

  get profileButton()         { return this.getTestId('user-profile-dropdown-button'); }
  get profileMenu()           { return this.getTestId('user-dropdown-menu'); }
  get viewProfileLink()       { return this.getTestId('dropdown-profile-link'); }
  get logoutButton()          { return this.getTestId('dropdown-logout-button'); }
  get userName()              { return this.getTestId('user-name-display'); }

  // ========= ACTIONS =========

  async openNotifications()      { await this.notificationBell.click(); }
  async markAllNotifications()   { await this.markAllReadButton.click(); }

  async openProfileMenu()        { await this.profileButton.click(); }
  async logout()                 { await this.logoutButton.click(); }

  async viewProfile()            { await this.viewProfileLink.click(); }

  // ========= BASIC READS =========

  async titleText()              { return this.title.textContent(); }
  async userNameText()           { return this.userName.textContent(); }

  async totalValueText()         { return this.totalValue.textContent(); }
  async resolvedValueText()      { return this.resolvedValue.textContent(); }
  async inProgressValueText()    { return this.inProgressValue.textContent(); }
  async pendingValueText()       { return this.pendingValue.textContent(); }

  async notificationBadgeText()  { return this.notificationBadge.textContent(); }

  // ========= HELPER METHODS =========

  async getStats() {
    const total = await this.totalValue.textContent();
    const resolved = await this.resolvedValue.textContent();
    const inProgress = await this.inProgressValue.textContent();
    const pending = await this.pendingValue.textContent();
    
    return {
      total: parseInt(total, 10),
      resolved: parseInt(resolved, 10),
      inProgress: parseInt(inProgress, 10),
      pending: parseInt(pending, 10)
    };
  }

  async getTotal() {
    const text = await this.totalValue.textContent();
    return parseInt(text, 10);
  }
}
