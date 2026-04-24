export const C = {
  bg: "#090C11",
  bg2: "#0D1219",
  bg3: "#111820",
  cyan: "#109DCE",
  cyanBright: "#19A8D5",
  cyanGlow: "rgba(16,157,206,0.15)",
  cyanBorder: "rgba(16,157,206,0.25)",
  silver: "#D2DDE1",
  silverDim: "#8A9BA3",
  white: "#F0F4F6",
  safe: "#32C87A",
  warn: "#E0A832",
  danger: "#E05252",
  font: "'Exo 2', sans-serif",
  fontMono: "'Share Tech Mono', monospace",
  fontDisplay: "'Rajdhani', sans-serif",
};

export const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@200;300;400;600&display=swap');`;

export const PIPELINE_STAGES = [
  { key: "initial_contact", label: "Initial Contact", desc: "Counterparty introduced and first communication established.", docs: ["Introduction Email", "Initial NDA"], generator: "nda" },
  { key: "kyc_submitted", label: "KYC Submitted", desc: "KYC documentation package received from counterparty.", docs: ["Passport", "Company Registration", "Proof of Address", "Beneficial Ownership"], generator: "kyc" },
  { key: "kyc_verified", label: "KYC Verified", desc: "KYC documentation reviewed and verified by compliance.", docs: ["KYC Verification Report", "Screening Certificate"], generator: null },
  { key: "loi_signed", label: "LOI Signed", desc: "Letter of Intent executed by all parties.", docs: ["Signed LOI", "Term Sheet"], generator: "loi" },
  { key: "aml_cleared", label: "AML Cleared", desc: "Anti-Money Laundering screening completed and cleared.", docs: ["AML Screening Report", "PEP Check", "Sanctions Clearance"], generator: "aml" },
  { key: "spa_drafted", label: "SPA Drafted", desc: "Sales and Purchase Agreement drafted and under review.", docs: ["SPA Draft", "Legal Review Notes"], generator: "spa" },
  { key: "spa_executed", label: "SPA Executed", desc: "SPA fully executed by all principals.", docs: ["Executed SPA", "Witness Signatures"], generator: null },
  { key: "skr_validated", label: "SKR Validated", desc: "Safe Keeping Receipt validated and confirmed with custodian.", docs: ["SKR Document", "Custodian Confirmation", "LBMA Certification"], generator: "skr" },
  { key: "escrow_opened", label: "Escrow Opened", desc: "Escrow account opened and funded per SPA terms.", docs: ["Escrow Agreement", "Funding Confirmation", "Bank Confirmation"], generator: null },
  { key: "deal_closed", label: "Deal Closed", desc: "Transaction completed and all obligations fulfilled.", docs: ["Closing Statement", "Transfer Confirmation", "Fee Settlement"], generator: "closing" },
];

export const ASSESSMENT_QUESTIONS = [
  {
    dimension: "identity",
    label: "Identity Verification",
    weight: 0.25,
    questions: [
      { key: "passport_received", label: "Has a government-issued passport or national ID been received?", type: "yn" },
      { key: "passport_certified", label: "Is the passport copy certified or notarized?", type: "yn" },
      { key: "name_matches", label: "Does the name match all company registration documents?", type: "yn" },
      { key: "beneficial_ownership", label: "Has beneficial ownership been declared for all principals with 10%+ interest?", type: "yn" },
      { key: "pep_screening", label: "Has a Politically Exposed Person (PEP) screening been completed?", type: "yn" },
      { key: "identity_source", label: "How was identity verified?", type: "select", options: ["Not yet verified", "Self-declared only", "Documents received unverified", "Documents verified by team", "Third party verification completed"] },
    ]
  },
  {
    dimension: "documentation",
    label: "Documentation Integrity",
    weight: 0.20,
    questions: [
      { key: "docs_received", label: "Which documents have been received?", type: "multiselect", options: ["Company Registration", "Certificate of Incorporation", "Articles of Association", "Bank Reference Letter", "Audited Financials", "LOI", "SPA Draft", "SKR", "Geological Report", "Surety Bond"] },
      { key: "official_letterhead", label: "Are all documents on official company letterhead?", type: "yn" },
      { key: "references_verifiable", label: "Are document reference numbers independently verifiable?", type: "yn" },
      { key: "legal_reviewed", label: "Have documents been reviewed by legal counsel?", type: "yn" },
      { key: "doc_quality", label: "Overall document quality assessment", type: "select", options: ["No documents received", "Informal documents only", "Formal but unverified", "Formally verified", "Institutionally certified"] },
    ]
  },
  {
    dimension: "history",
    label: "Transaction History",
    weight: 0.20,
    questions: [
      { key: "prior_deals", label: "Has this counterparty completed prior transactions in this sector?", type: "yn" },
      { key: "references_available", label: "Are verifiable references from prior deals available?", type: "yn" },
      { key: "reference_source", label: "Reference source type", type: "select", options: ["No references", "Self-provided only", "Professional network", "Institutional referral", "Verified completed transactions"] },
      { key: "exchange_registered", label: "Is the counterparty registered with any exchange or regulatory body (LBMA, SEC, etc.)?", type: "yn" },
      { key: "operational_history", label: "How long has this entity been operational?", type: "select", options: ["Unknown", "Less than 1 year", "1 to 3 years", "3 to 5 years", "More than 5 years"] },
    ]
  },
  {
    dimension: "source",
    label: "Source Credibility",
    weight: 0.15,
    questions: [
      { key: "introduction_source", label: "How was this counterparty introduced?", type: "select", options: ["Cold outreach / unsolicited", "Online platform or directory", "Professional conference", "Mutual professional contact", "Trusted intermediary", "Existing verified partner", "Institutional referral"] },
      { key: "intermediary_known", label: "Is the introducing intermediary personally known and verified?", type: "yn" },
      { key: "introduction_chain", label: "How many intermediaries exist between you and the counterparty?", type: "select", options: ["Direct contact", "One intermediary", "Two intermediaries", "Three or more intermediaries"] },
      { key: "platform_verified", label: "Has the counterparty been verified on any institutional platform (Bloomberg, Refinitiv, etc.)?", type: "yn" },
    ]
  },
  {
    dimension: "advancefee",
    label: "Advance Fee Risk",
    weight: 0.12,
    questions: [
      { key: "upfront_payment", label: "Has an upfront payment, fee, or deposit been requested before deal execution?", type: "yn_reverse" },
      { key: "urgency_language", label: "Has urgency language been used (limited time offer, act now, exclusive window)?", type: "yn_reverse" },
      { key: "deal_terms_changed", label: "Have deal terms changed unexpectedly after initial agreement?", type: "yn_reverse" },
      { key: "third_party_fees", label: "Have unexplained third party fees or taxes been introduced?", type: "yn_reverse" },
      { key: "communication_channel", label: "Primary communication channel", type: "select", options: ["WhatsApp only", "Personal email only", "Mixed channels", "Corporate email", "Corporate email with formal documentation"] },
      { key: "pressure_tactics", label: "Have pressure tactics or threats been used to accelerate the deal?", type: "yn_reverse" },
    ]
  },
  {
    dimension: "jurisdiction",
    label: "Jurisdictional Compliance",
    weight: 0.08,
    questions: [
      { key: "fatf_status", label: "FATF status of counterparty jurisdiction", type: "select", options: ["FATF Black List", "FATF Grey List", "High risk non-FATF", "Standard risk jurisdiction", "Low risk FATF member"] },
      { key: "sanctions_exposure", label: "Has a sanctions screening been completed with no adverse findings?", type: "yn" },
      { key: "legal_enforceability", label: "Are contracts legally enforceable in the counterparty jurisdiction?", type: "yn" },
      { key: "regulatory_license", label: "Does the counterparty hold required regulatory licenses for their stated activity?", type: "yn" },
    ]
  },
];

export const TX_TYPES = [
  "Gold Offtake Agreement", "Copper / Cobalt Sourcing", "Critical Minerals Supply",
  "Structured Bullion Flow", "Co-Lending / Capital Facility", "Project Finance",
  "Investor Subscription", "Joint Venture", "Other Commodity Transaction"
];

export const REL_SOURCES = [
  "Cold outreach / unsolicited", "Professional conference", "Mutual contact",
  "Trusted intermediary", "Existing verified partner", "Institutional referral"
];
