import { BasePage } from '../_base.page.js';

export class ComplaintDetailPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // LOCATORS
  get container() { return this.getTestId('complaint-detail-container'); }
  get backBtn() { return this.getTestId('detail-back-btn'); }
  get title() { return this.getTestId('complaint-detail-title'); }
  get complaintId() { return this.getTestId('complaint-detail-id'); }
  get status() { return this.getTestId('complaint-detail-status'); }
  get category() { return this.getTestId('complaint-detail-category'); }
  get priority() { return this.getTestId('complaint-detail-priority'); }
  get description() { return this.getTestId('complaint-detail-description'); }
  get submissionDate() { return this.getTestId('complaint-detail-submission-date'); }
  get committee() { return this.getTestId('complaint-detail-assigned-committee'); }
  get attachments() { return this.getTestId('complaint-detail-attachments'); }
  get statusHistory() { return this.getTestId('status-history-section'); }
  get editBtn() { return this.getTestId('detail-edit-btn'); }
  get deleteBtn() { return this.getTestId('detail-delete-btn'); }
  get upvoteBtn() { return this.getTestId('detail-upvote-btn'); }

  // ACTIONS
  async goBack() { await this.backBtn.click(); }
  async clickEdit() { await this.editBtn.click(); }
  async clickDelete() { await this.deleteBtn.click(); }
  async clickUpvote() { await this.upvoteBtn.click(); }

  // READS
  titleText() { return this.title.textContent(); }
  idText() { return this.complaintId.textContent(); }
  statusText() { return this.status.textContent(); }
  descriptionText() { return this.description.textContent(); }
  isVisible() { return this.container.isVisible(); }
}
