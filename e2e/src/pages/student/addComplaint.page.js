import { BasePage } from "../_base.page.js";

export class AddComplaintPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;
  }

  // --------------------- Locators ---------------------

  titleInput()        { return this.getTestId("title-input"); }
  descInput()         { return this.getTestId("description-input"); }
  fileInput()         { return this.getTestId("file-input"); }

  personalRadio()     { return this.getTestId("type-personal-radio"); }
  publicRadio()       { return this.getTestId("type-public-radio"); }

  anonymousCheckbox() { return this.getTestId("anonymous-checkbox"); }

  submitButton()      { return this.getTestId("submit-complaint-button"); }

  successModal()      { return this.getTestId("success-modal-container"); }
  successId()         { return this.getTestId("complaint-id-display"); }
  successCommittee()  { return this.getTestId("routed-committee-display"); }

  errorContainer()    { return this.getTestId("error-container"); }
  errorList()         { return this.getTestId("error-list"); }

  // --------------------- Actions ---------------------

  async fillTitle(value) {
    await this.titleInput().fill(value);
  }

  async fillDescription(value) {
    await this.descInput().fill(value);
  }

  async uploadFile(filePath) {
    await this.fileInput().setInputFiles(filePath);
  }

  async selectPersonal() {
    await this.personalRadio().check();
  }

  async selectPublic() {
    await this.publicRadio().check();
  }

  async toggleAnonymous(value) {
    if (value) await this.anonymousCheckbox().check();
    else await this.anonymousCheckbox().uncheck();
  }

  async submit() {
    await this.submitButton().click();
  }

  // --------------------- Success Modal Helpers ---------------------

  async waitForSuccessModal() {
    await this.successModal().waitFor({ state: "visible", timeout: 15000 });
  }

  async getComplaintId() {
    return (await this.successId().textContent()).trim();
  }

  async getCommittee() {
    return (await this.successCommittee().textContent()).trim();
  }

  // --------------------- Error Helpers ---------------------

  async getErrorList() {
    return (await this.errorList().textContent()).trim();
  }

  async waitForErrorContainer() {
    await this.errorContainer().waitFor({ state: "visible", timeout: 5000 });
  }
}
