import { jsPDF } from "jspdf";

const PRIMARY = [16/255, 157/255, 206/255];
const DARK = [9/255, 12/255, 17/255];
const SILVER = [210/255, 221/255, 225/255];
const DARK_TEXT = [30/255, 40/255, 50/255];

function addHeader(doc, company, refNumber, docTitle) {
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 40, "F");
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 38, 210, 1.5, "F");

  if (company.logo_url) {
    try {
      doc.addImage(company.logo_url, "PNG", 14, 6, 28, 28);
    } catch (e) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(company.company_name || "Company Name", company.logo_url ? 48 : 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SILVER.map(v => Math.round(v * 255)));
  doc.text(company.company_address || "", company.logo_url ? 48 : 14, 25);
  doc.text(company.phone || "", company.logo_url ? 48 : 14, 30);

  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.text("REF: " + refNumber, 196, 18, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 196, 24, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK_TEXT);
  doc.text(docTitle, 14, 58);

  doc.setFillColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.rect(14, 61, 60, 0.8, "F");

  return 72;
}

function addFooter(doc, company, pageNum) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.rect(0, pageHeight - 16, 210, 0.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 130, 140);
  doc.text(company.company_name + " | " + (company.website || "") + " | " + (company.signatory_email || ""), 14, pageHeight - 9);
  doc.text("Page " + pageNum, 196, pageHeight - 9, { align: "right" });
}

function sectionTitle(doc, text, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.text(text.toUpperCase(), 14, y);
  doc.setFillColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.rect(14, y + 1.5, 182, 0.3, "F");
  return y + 8;
}

function fieldRow(doc, label, value, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text(label + ":", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  doc.text(value || "________________", 70, y);
  return y + 7;
}

function bodyText(doc, text, y, maxWidth) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_TEXT);
  const lines = doc.splitTextToSize(text, maxWidth || 182);
  doc.text(lines, 14, y);
  return y + lines.length * 5 + 2;
}

function signatureBlock(doc, company, y) {
  if (y > 240) { doc.addPage(); y = 20; }
  y += 8;
  doc.setFillColor(245, 247, 250);
  doc.rect(14, y, 182, 35, "F");
  doc.setDrawColor(...PRIMARY.map(v => Math.round(v * 255)));
  doc.rect(14, y, 182, 35, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_TEXT);
  doc.text("AUTHORIZED SIGNATORY", 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text("Name: " + (company.signatory_name || "___________________"), 20, y + 16);
  doc.text("Title: " + (company.signatory_title || "___________________"), 20, y + 22);
  doc.text("Date: ___________________", 20, y + 28);
  doc.text("Signature: ___________________", 110, y + 28);
  return y + 42;
}

function generateRef(prefix, counterpartyName) {
  const date = new Date();
  const code = counterpartyName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
  return prefix + "-" + code + "-" + date.getFullYear() + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0") + "-" + Math.floor(Math.random() * 900 + 100);
}

export function generateKYC(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("KYC", counterparty.name);
  let y = addHeader(doc, company, ref, "Know Your Customer Request");

  y = sectionTitle(doc, "Document Purpose", y);
  y = bodyText(doc, company.company_name + " is required to verify the identity and credentials of all counterparties prior to entering into any commercial agreement. Please complete all sections of this form and provide the supporting documentation listed below.", y);

  y += 4;
  y = sectionTitle(doc, "Counterparty Details", y);
  y = fieldRow(doc, "Counterparty Name", counterparty.name, y);
  y = fieldRow(doc, "Jurisdiction", counterparty.country, y);
  y = fieldRow(doc, "Transaction Type", counterparty.tx_type, y);
  y = fieldRow(doc, "Estimated Value", counterparty.tx_value, y);
  y = fieldRow(doc, "Primary Contact", "", y);
  y = fieldRow(doc, "Contact Email", "", y);
  y = fieldRow(doc, "Contact Phone", "", y);

  y += 4;
  y = sectionTitle(doc, "Required Documentation", y);
  const docs = [
    "1. Certified copy of valid government-issued passport or national ID for all principals",
    "2. Certificate of Incorporation or equivalent company registration document",
    "3. Memorandum and Articles of Association",
    "4. Beneficial Ownership Declaration identifying all owners with 10% or greater interest",
    "5. Proof of registered business address (utility bill or bank statement, dated within 90 days)",
    "6. Most recent audited financial statements or bank reference letter",
    "7. Source of funds declaration signed by authorized signatory",
    "8. Sanctions screening consent form"
  ];
  docs.forEach(d => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(d, 14, y);
    y += 6;
  });

  y += 4;
  y = sectionTitle(doc, "Declaration", y);
  y = bodyText(doc, "I hereby confirm that the information provided in this form and accompanying documents is true, accurate and complete to the best of my knowledge. I understand that providing false information may result in immediate termination of any agreement and potential legal action.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateNDA(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("NDA", counterparty.name);
  let y = addHeader(doc, company, ref, "Non-Disclosure Agreement");

  y = sectionTitle(doc, "Parties", y);
  y = fieldRow(doc, "Disclosing Party", company.company_name, y);
  y = fieldRow(doc, "Receiving Party", counterparty.name, y);
  y = fieldRow(doc, "Jurisdiction", counterparty.country, y);
  y = fieldRow(doc, "Effective Date", new Date().toLocaleDateString(), y);

  y += 4;
  y = sectionTitle(doc, "Purpose", y);
  y = bodyText(doc, "The parties wish to explore a potential business relationship involving " + (counterparty.tx_type || "commodity transactions") + " valued at approximately " + (counterparty.tx_value || "an amount to be agreed") + ". In connection with this potential relationship, each party may disclose confidential information to the other.", y);

  y += 4;
  y = sectionTitle(doc, "Confidential Information", y);
  y = bodyText(doc, "Confidential Information means any information disclosed by either party to the other, either directly or indirectly, in writing, orally or by inspection of tangible objects, including without limitation technical data, trade secrets, know-how, research, product plans, products, services, customers, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration, marketing, finances or other business information.", y);

  y += 4;
  y = sectionTitle(doc, "Obligations", y);
  y = bodyText(doc, "The Receiving Party agrees to: (a) hold the Confidential Information in strict confidence; (b) not to disclose the Confidential Information to any third parties without prior written consent; (c) use the Confidential Information solely for the purpose of evaluating the potential business relationship; (d) protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but no less than reasonable care.", y);

  y += 4;
  y = sectionTitle(doc, "Term", y);
  y = bodyText(doc, "This Agreement shall remain in effect for a period of two (2) years from the Effective Date unless earlier terminated by mutual written agreement of the parties.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateLOI(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("LOI", counterparty.name);
  let y = addHeader(doc, company, ref, "Letter of Intent");

  y = bodyText(doc, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), y);
  y += 4;
  y = bodyText(doc, "To: " + counterparty.name, y);
  y = bodyText(doc, "Re: Letter of Intent for " + (counterparty.tx_type || "Commodity Transaction"), y);
  y += 4;

  y = sectionTitle(doc, "Introduction", y);
  y = bodyText(doc, company.company_name + " (hereinafter the Company) is pleased to submit this Letter of Intent expressing our interest in entering into a formal agreement with " + counterparty.name + " for the purposes of " + (counterparty.tx_type || "a commodity transaction") + ".", y);

  y += 4;
  y = sectionTitle(doc, "Transaction Overview", y);
  y = fieldRow(doc, "Transaction Type", counterparty.tx_type, y);
  y = fieldRow(doc, "Estimated Value", counterparty.tx_value, y);
  y = fieldRow(doc, "Counterparty", counterparty.name, y);
  y = fieldRow(doc, "Jurisdiction", counterparty.country, y);
  y = fieldRow(doc, "Commodities", (company.primary_commodities || []).join(", "), y);
  y = fieldRow(doc, "Target Closing Date", "", y);

  y += 4;
  y = sectionTitle(doc, "Key Terms", y);
  y = bodyText(doc, "Subject to satisfactory completion of due diligence, negotiation and execution of definitive agreements, and receipt of any required regulatory approvals, the parties intend to negotiate in good faith toward a binding agreement incorporating the following terms:", y);
  y += 4;
  const terms = [
    "1. Transaction structure and pricing to be agreed upon execution of formal SPA",
    "2. All parties to complete KYC and AML verification prior to execution",
    "3. Payment terms and escrow arrangements to be specified in definitive agreement",
    "4. Representations and warranties standard for transactions of this nature",
    "5. Governing law and dispute resolution to be agreed by parties"
  ];
  terms.forEach(t => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(t, 14, y);
    y += 6;
  });

  y += 4;
  y = sectionTitle(doc, "Non-Binding Nature", y);
  y = bodyText(doc, "This Letter of Intent is intended solely as an expression of interest and does not constitute a binding agreement. Neither party shall have any legal obligation to the other unless and until definitive agreements are fully executed by authorized representatives of both parties.", y);

  y += 4;
  y = sectionTitle(doc, "Confidentiality", y);
  y = bodyText(doc, "The parties agree to keep the existence and terms of this Letter of Intent confidential and not to disclose the same to any third party without the prior written consent of the other party.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateAML(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("AML", counterparty.name);
  let y = addHeader(doc, company, ref, "AML Screening Checklist");

  y = sectionTitle(doc, "Screening Details", y);
  y = fieldRow(doc, "Counterparty", counterparty.name, y);
  y = fieldRow(doc, "Jurisdiction", counterparty.country, y);
  y = fieldRow(doc, "Transaction Type", counterparty.tx_type, y);
  y = fieldRow(doc, "Screening Date", new Date().toLocaleDateString(), y);
  y = fieldRow(doc, "Screened By", company.signatory_name, y);

  y += 4;
  y = sectionTitle(doc, "Screening Checklist", y);
  const checks = [
    "OFAC Sanctions List screening completed",
    "UN Security Council Consolidated List checked",
    "EU Consolidated Financial Sanctions List checked",
    "UK HM Treasury Financial Sanctions List checked",
    "Politically Exposed Person (PEP) screening completed",
    "Adverse media search conducted",
    "Beneficial ownership verified against sanctions lists",
    "Correspondent bank screening completed",
    "Source of funds verified and documented",
    "Geographic risk assessment completed"
  ];
  checks.forEach((check, i) => {
    doc.setFillColor(245, 247, 250);
    doc.rect(14, y - 4, 182, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(check, 24, y);
    doc.setDrawColor(...PRIMARY.map(v => Math.round(v * 255)));
    doc.rect(16, y - 3, 5, 5, "S");
    y += 9;
  });

  y += 4;
  y = sectionTitle(doc, "Screening Result", y);
  y = fieldRow(doc, "Overall Result", "CLEAR / REFER / REJECT", y);
  y = fieldRow(doc, "Risk Rating", "LOW / MEDIUM / HIGH", y);
  y = fieldRow(doc, "Notes", "", y);
  y += 10;
  y = fieldRow(doc, "Next Review Date", "", y);

  y += 4;
  y = sectionTitle(doc, "Compliance Officer Declaration", y);
  y = bodyText(doc, "I confirm that the above screening has been conducted in accordance with applicable AML/CTF regulations and company policy. The results have been recorded and are available for inspection upon request.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateSPA(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("SPA", counterparty.name);
  let y = addHeader(doc, company, ref, "Sales and Purchase Agreement");

  y = sectionTitle(doc, "Parties", y);
  y = fieldRow(doc, "Seller", counterparty.name, y);
  y = fieldRow(doc, "Buyer", company.company_name, y);
  y = fieldRow(doc, "Date", new Date().toLocaleDateString(), y);

  y += 4;
  y = sectionTitle(doc, "Transaction Details", y);
  y = fieldRow(doc, "Commodity", (company.primary_commodities || []).join(", "), y);
  y = fieldRow(doc, "Quantity", "To be specified in Schedule A", y);
  y = fieldRow(doc, "Quality", "To be specified in Schedule A", y);
  y = fieldRow(doc, "Purchase Price", counterparty.tx_value, y);
  y = fieldRow(doc, "Delivery Terms", "", y);
  y = fieldRow(doc, "Delivery Location", "", y);
  y = fieldRow(doc, "Payment Terms", "", y);

  y += 4;
  y = sectionTitle(doc, "Conditions Precedent", y);
  const conditions = [
    "1. Satisfactory completion of KYC and AML verification for all parties",
    "2. Execution of this Agreement by authorized signatories of both parties",
    "3. Establishment of escrow arrangements as specified in Schedule B",
    "4. Receipt of all required regulatory approvals and export licenses",
    "5. Delivery of product documentation including certificates of origin and assay reports"
  ];
  conditions.forEach(c => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(c, 14, y);
    y += 6;
  });

  y += 4;
  y = sectionTitle(doc, "Representations and Warranties", y);
  y = bodyText(doc, "Each party represents and warrants that: (a) it has full legal authority to enter into this Agreement; (b) this Agreement has been duly authorized and constitutes a valid and binding obligation; (c) the execution of this Agreement does not violate any applicable law or regulation; (d) all information provided is true, accurate and complete.", y);

  y += 4;
  y = sectionTitle(doc, "Governing Law", y);
  y = fieldRow(doc, "Governing Law", "", y);
  y = fieldRow(doc, "Dispute Resolution", "Arbitration", y);
  y = fieldRow(doc, "Arbitration Seat", "", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateSKR(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("SKR", counterparty.name);
  let y = addHeader(doc, company, ref, "SKR Validation Request");

  y = sectionTitle(doc, "Request Details", y);
  y = fieldRow(doc, "Requesting Party", company.company_name, y);
  y = fieldRow(doc, "SKR Holder", counterparty.name, y);
  y = fieldRow(doc, "Custodian", "", y);
  y = fieldRow(doc, "SKR Reference", "", y);
  y = fieldRow(doc, "Request Date", new Date().toLocaleDateString(), y);

  y += 4;
  y = sectionTitle(doc, "Asset Details", y);
  y = fieldRow(doc, "Asset Type", (company.primary_commodities || []).join(", "), y);
  y = fieldRow(doc, "Quantity", "", y);
  y = fieldRow(doc, "Purity / Grade", "", y);
  y = fieldRow(doc, "Storage Location", "", y);
  y = fieldRow(doc, "Estimated Value", counterparty.tx_value, y);
  y = fieldRow(doc, "LBMA Certified", "YES / NO", y);

  y += 4;
  y = sectionTitle(doc, "Validation Requirements", y);
  const reqs = [
    "1. Confirmation that SKR is valid and currently in force",
    "2. Verification that the named holder matches KYC documentation on file",
    "3. Confirmation of asset quantity, quality and storage location",
    "4. Confirmation that assets are unencumbered and free of all liens",
    "5. Confirmation of custodian authorization to release upon instruction",
    "6. Copy of most recent independent assay report",
    "7. Chain of custody documentation from point of production"
  ];
  reqs.forEach(r => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(r, 14, y);
    y += 6;
  });

  y += 4;
  y = sectionTitle(doc, "Authorization", y);
  y = bodyText(doc, company.company_name + " hereby authorizes the named custodian to provide confirmation of the above details to our authorized representative. This request is made in connection with a proposed transaction and all information received will be treated as strictly confidential.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}

export function generateClosing(company, counterparty) {
  const doc = new jsPDF();
  const ref = generateRef("CLOSE", counterparty.name);
  let y = addHeader(doc, company, ref, "Transaction Closing Statement");

  y = sectionTitle(doc, "Transaction Summary", y);
  y = fieldRow(doc, "Transaction Reference", ref, y);
  y = fieldRow(doc, "Closing Date", new Date().toLocaleDateString(), y);
  y = fieldRow(doc, "Counterparty", counterparty.name, y);
  y = fieldRow(doc, "Transaction Type", counterparty.tx_type, y);
  y = fieldRow(doc, "Commodity", (company.primary_commodities || []).join(", "), y);
  y = fieldRow(doc, "Transaction Value", counterparty.tx_value, y);

  y += 4;
  y = sectionTitle(doc, "Closing Checklist", y);
  const items = [
    "KYC and AML verification completed and on file",
    "NDA executed by all parties",
    "Letter of Intent signed",
    "SPA fully executed by authorized signatories",
    "SKR validated and confirmed by custodian",
    "Escrow account opened and funded",
    "Regulatory approvals received",
    "Product documentation received and verified",
    "Title transfer completed",
    "Payment confirmed and settled"
  ];
  items.forEach((item, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 252, 249, 250);
    doc.rect(14, y - 4, 182, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(item, 24, y);
    doc.setDrawColor(...PRIMARY.map(v => Math.round(v * 255)));
    doc.rect(16, y - 3, 5, 5, "S");
    y += 9;
  });

  y += 4;
  y = sectionTitle(doc, "Fee Settlement", y);
  y = fieldRow(doc, "Gross Transaction Value", counterparty.tx_value, y);
  y = fieldRow(doc, "Platform Facilitation Fee", "", y);
  y = fieldRow(doc, "Net Amount to Client", "", y);
  y = fieldRow(doc, "Fee Payment Date", "", y);
  y = fieldRow(doc, "Fee Payment Reference", "", y);

  y += 4;
  y = sectionTitle(doc, "Closing Declaration", y);
  y = bodyText(doc, "This Closing Statement confirms that all conditions precedent to closing have been satisfied and the above-referenced transaction has been completed in accordance with the terms of the executed Sales and Purchase Agreement.", y);

  y = signatureBlock(doc, company, y);
  addFooter(doc, company, 1);
  doc.save(ref + ".pdf");
  return ref;
}
