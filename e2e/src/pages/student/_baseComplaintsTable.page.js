import { BasePage } from '../_base.page.js';

export class BaseComplaintsTablePage extends BasePage {
  constructor(page) {
    super(page);
  }

  // get complaint row by ID
  getComplaintRow(complaintId) {
    return this.getTestId(`complaint-row-${complaintId}`);
  }

  // get specific cell from complaint row
  getRowCell(complaintId, cellType) {
    // cellType: 'status', 'title', 'priority', 'date', 'upvotes'
    return this.getTestId(`complaint-cell-${complaintId}-${cellType}`);
  }

  // get upvote button for complaint
  getUpvoteButton(complaintId) {
    return this.getTestId(`complaint-upvote-${complaintId}`);
  }

  // get delete button for complaint
  getDeleteButton(complaintId) {
    return this.getTestId(`complaint-delete-${complaintId}`);
  }

  // get view/detail button for complaint
  getViewButton(complaintId) {
    return this.getTestId(`complaint-view-${complaintId}`);
  }


  // get search input
  getSearchInput() {
    return this.getTestId('table-search-input');
  }

  // filter dropdown
  getFilterDropdown() {
    return this.getTestId('table-filter-dropdown');
  }

 // get sort dropdown
  getSortDropdown() {
    return this.getTestId('table-sort-dropdown');
  }

  // get all complaint rows
  getTableRows() {
    return this.page.locator('[data-testid^="complaint-row-"]');
  }
  // empty state message
  getEmptyStateMessage() {
    return this.getTestId('table-empty-state');
  }
  // delete confirmation button
  getDeleteConfirmButton() {
    return this.getTestId('delete-confirm-btn');
  }

// delete cancel button
  getDeleteCancelButton() {
    return this.getTestId('delete-cancel-btn');
  }

  //get success modal
  getSuccessModal() {
    return this.getTestId('success-modal');
  }

  getConfirmationModal() {
    return this.getTestId('confirmation-modal');
  }
}
