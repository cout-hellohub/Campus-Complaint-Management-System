/**
 * File Complaint Flow (NEW)
 * - Fills the Add Complaint form
 * - Supports: title, description, type, isAnonymous, files
 * - Waits for success modal
 * - Extracts complaint ID + routed committee
 */

export async function fileComplaintFlow(page, addComplaintPage, {
  title,
  description,
  type = "Public",
  isAnonymous = false,
  files = [],
}) {
  // Fill the basic fields
  await addComplaintPage.fillTitle(title);
  await addComplaintPage.fillDescription(description);

  // Select complaint type
  if (type === "Personal") {
    await addComplaintPage.selectPersonal();
  } else {
    await addComplaintPage.selectPublic();
  }

  // Anonymous checkbox
  if (isAnonymous) {
    await addComplaintPage.toggleAnonymous(true);
  }

  // File uploads
  for (const file of files) {
    await addComplaintPage.uploadFile(file);
  }

  // Submit
  await addComplaintPage.submit();

  // Wait for loading modal
  await page.getByTestId("loading-modal-container").waitFor({ state: "visible" });
 // Wait for either loading modal to hide OR success modal to show
await Promise.race([
  page.getByTestId("loading-modal-container").waitFor({ state: "hidden", timeout: 25000 }),
  page.getByTestId("success-modal-container").waitFor({ state: "visible", timeout: 25000 })
]);


  // Wait for success modal
  const successModal = page.getByTestId("success-modal-container");
  await successModal.waitFor({ state: "visible", timeout: 25000 });

  // Extract success details
  const complaintId = (await page.getByTestId("complaint-id-display").textContent()).trim();
  const committee = (await page.getByTestId("routed-committee-display").textContent()).trim();

  return { complaintId, committee };
}
