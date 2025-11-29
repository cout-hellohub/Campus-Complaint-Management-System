import { BasePage } from "../_base.page.js";
import path from "path";
import fs from "fs";

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
    // Robust path resolution: allow running tests from root or e2e directory.
    const original = filePath;
    const candidates = [];

    // Absolute path as-is.
    if (path.isAbsolute(filePath)) candidates.push(filePath);

    // Relative from current working directory.
    candidates.push(path.resolve(process.cwd(), filePath));

    // If starts with e2e/, try stripped and also original.
    if (/^e2e[\\/]/i.test(filePath)) {
      const stripped = filePath.replace(/^e2e[\\/]/i, "");
      candidates.push(path.resolve(process.cwd(), stripped));
    } else {
      candidates.push(path.resolve(process.cwd(), "e2e", filePath));
    }

    const existing = candidates.find(p => fs.existsSync(p));
    if (!existing) {
      throw new Error(`Test file not found. Tried: ${candidates.join(" | ")} (input: ${original})`);
    }
    await this.fileInput().setInputFiles(existing);
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

  async waitForSuccessModal() {
    await this.successModal().waitFor({ state: "visible", timeout: 15000 });
  }

  async getComplaintId() {
    return (await this.successId().textContent()).trim();
  }

  async getCommittee() {
    return (await this.successCommittee().textContent()).trim();
  }

  async getErrorList() {
    return (await this.errorList().textContent()).trim();
  }

  async waitForErrorContainer() {
    await this.errorContainer().waitFor({ state: "visible", timeout: 5000 });
  }
}
