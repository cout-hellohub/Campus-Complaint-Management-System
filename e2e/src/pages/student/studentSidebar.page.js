import { BasePage } from '../_base.page.js';

export class StudentSidebarPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // LOCATORS
  get container() { return this.getTestId('sidebar-container'); }
  get homeLink() { return this.getTestId('sidebar-home-link'); }
  get addComplaintLink() { return this.getTestId('sidebar-add-complaint-link'); }
  get myComplaintsLink() { return this.getTestId('sidebar-my-complaints-link'); }
  get allComplaintsLink() { return this.getTestId('sidebar-all-complaints-link'); }
  get homeLinkParent() { return this.homeLink.locator('..'); }
  get addComplaintLinkParent() { return this.addComplaintLink.locator('..'); }
  get myComplaintsLinkParent() { return this.myComplaintsLink.locator('..'); }
  get allComplaintsLinkParent() { return this.allComplaintsLink.locator('..'); }

  // ACTIONS
  async goHome() { await this.homeLink.click(); }
  async goToAddComplaint() { await this.addComplaintLink.click(); }
  async goToMyComplaints() { await this.myComplaintsLink.click(); }
  async goToAllComplaints() { await this.allComplaintsLink.click(); }

  // Legacy compatibility methods
  async clickHomeLink() { await this.goHome(); }
  async clickAddComplaintLink() { await this.goToAddComplaint(); }
  async clickMyComplaintsLink() { await this.goToMyComplaints(); }
  async clickAllComplaintsLink() { await this.goToAllComplaints(); }

  async isLinkActive(testId) {
    const cls = await this.getTestId(testId).getAttribute('class');
    return Boolean(cls && cls.includes('bg-blue-50'));
  }

  // READS
  async isVisible() { return this.container.isVisible(); }
}
