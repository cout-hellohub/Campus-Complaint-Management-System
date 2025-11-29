import { BaseComplaintsTablePage } from './_baseComplaintsTable.page.js';

export class AllComplaintsPage extends BaseComplaintsTablePage {
  constructor(page) {
    super(page);
  }

  get pageTitle() { return this.getTestId('all-complaints-page-title'); }
  get filterPanel() { return this.getTestId('filter-panel'); }
  get committeeSelect() { return this.getTestId('filter-committee-select'); }

  async selectCommittee(value) {
    await this.committeeSelect.selectOption(value);
  }

  pageTitleText() {
    return this.pageTitle.textContent();
  }

  isFilterPanelVisible() {
    return this.filterPanel.isVisible();
  }
}
