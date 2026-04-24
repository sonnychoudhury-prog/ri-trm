import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { generateKYC, generateNDA, generateLOI, generateAML, generateSPA, generateSKR, generateClosing } from "./DocGenerator";

const CYAN = "#109DCE";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const WARN = "#E0A832";
const DANGER = "#E05252";

const PIPELINE_STAGES = [
  { key: "initial_contact", label: "Initial Contact", desc: "Counterparty introduced and first communication established.", docs: ["Introduction Email", "Initial NDA"], generators: [{ label: "GENERATE NDA", fn: "nda" }] },
  { key: "kyc_submitted", label: "KYC Submitted", desc: "Know Your Customer documentation received from counterparty.", docs: ["Passport", "Company Registration", "Proof of Address", "Beneficial Ownership"], generators: [{ label: "GENERATE KYC FORM", fn: "kyc" }] },
  { key: "kyc_verified", label: "KYC Verified", desc: "KYC documentation reviewed and verified by compliance.", docs: ["KYC Verification Report", "Screening Certificate"], generators: [] },
  { key: "loi_signed", label: "LOI Signed", desc: "Letter of Intent executed by all parties.", docs: ["Signed LOI", "Term Sheet"], generators: [{ label: "GENERATE LOI", fn: "loi" }] },
  { key: "aml_cleared", label: "AML Cleared", desc: "Anti-Money Laundering screening completed and cleared.", docs: ["AML Screening Report", "PEP Check", "Sanctions Clearance"], generators: [{ label: "GENERATE AML CHECKLIST", fn: "aml" }] },
  { key: "spa_drafted", label: "SPA Drafted", desc: "Sales and Purchase Agreement drafted and under review.", docs: ["SPA Draft", "Legal Review Notes"], generators: [{ label: "GENERATE SPA FRAMEWORK", fn: "spa" }] },
  { key: "spa_executed", label: "SPA Executed", desc: "SPA fully executed by all principals.", docs: ["Executed SPA", "Witness Signatures"], generators: [] },
  { key: "skr_validated", label: "SKR Validated", desc: "Safe Keeping Receipt validated and confirmed with custodian.", docs: ["SKR Document", "Custodian Confirmation", "LBMA Certification"], generators: [{ label: "GENERATE SKR REQUEST", fn: "skr" }] },
  { key: "escrow_opened", label: "Escrow Opened", desc: "Escrow account opened and funded per SPA terms.", docs: ["Escrow Agreement", "Funding Confirmation", "Bank Confirmation"], generators: [] },
  { key: "deal_closed", label: "Deal Closed", desc: "Transaction completed and all obligations fulfilled.", docs: ["Closing Statement", "Transfer Confirmation", "Fee Settlement"], generators: [{ label: "GENERATE CLOSING STATEMENT", fn: "closing" }] },
];

const STATUS_OPTIONS = ["pending", "in_progress", "complete", "blocked"];

function statusColor(status) {
  if (status === "complete") return SAFE;
  if (status === "in_progress") return CYAN;
  if (status === "blocked") return DANGER;
  return SILVER_DIM;
}

function statusLabel(status) {
  if (status === "complete") return "COMPLETE";
  if (status === "in_progress") return "IN PROGRESS";
  if (status === "blocked") return "BLOCKED";
  return "PENDING";
}

export default function Workflow({ counterpartyId, counterpartyName, userId, counterparty }) {
  const [stages, setStages] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState({});
  const [companySettings, setCompanySettings] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [genMsg, setGenMsg] = useState("");

  useEffect(() => { loadStages(); loadCompanySettings(); }, [counterpartyId]);

  async function loadStages() {
    const { data } = await supabase.from("deal_stages").select("*").eq("counterparty_id", counterpartyId);
    if (data) {
      const map = {};
      data.forEach(s => { map[s.stage] = s; });
      setStages(map);
    }
  }

  async function loadCompanySettings() {
    const { data } = await supabase.from("company_settings").select("*").eq("user_id", userId).single();
    if (data) setCompanySettings(data);
  }

  function getEdit(key) {
    return editState[key] || {
      status: stages[key]?.status || "pending",
      override: stages[key]?.override || false,
      override_reason: stages[key]?.override_reason || "",
      override_authority: stages[key]?.override_authority || "",
      notes: stages[key]?.notes || "",
      document_ref: stages[key]?.document_ref || "",
    };
  }

  function setEdit(key, field, value) {
    setEditState(e => ({ ...e, [key]: { ...getEdit(key), [field]: value } }));
  }

  async function saveStage(key) {
    setSaving(true);
    const edit = getEdit(key);
    const existing = stages[key];
    const payload = {
      counterparty_id: counterpartyId, user_id: userId, stage: key,
      status: edit.status, override: edit.override,
      override_reason: edit.override_reason, override_authority: edit.override_authority,
      notes: edit.notes, document_ref: edit.document_ref,
      updated_at: new Date().toISOString(),
      completed_at: edit.status === "complete" ? new Date().toISOString() : null,
    };
    if (existing?.id) await supabase.from("deal_stages").update(payload).eq("id", existing.id);
    else await supabase.from("deal_stages").insert(payload);
    await loadStages();
    setEditState(e => { const n = { ...e }; delete n[key]; return n; });
    setSaving(false);
    setExpanded(null);
  }

  async function handleGenerate(fn, stageKey) {
    if (!companySettings) { setGenMsg("Please complete your Company Settings before generating documents."); return; }
    setGenerating(stageKey + fn);
    setGenMsg("");
    try {
      const cp = counterparty || { name: counterpartyName, country: "", tx_type: "", tx_value: "" };
      let ref = "";
      if (fn === "kyc") ref = generateKYC(companySettings, cp);
      else if (fn === "nda") ref = generateNDA(companySettings, cp);
      else if (fn === "loi") ref = generateLOI(companySettings, cp);
      else if (fn === "aml") ref = generateAML(companySettings, cp);
      else if (fn === "spa") ref = generateSPA(companySettings, cp);
      else if (fn === "skr") ref = generateSKR(companySettings, cp);
      else if (fn === "closing") ref = generateClosing(companySettings, cp);
      setGenMsg("Document generated: " + ref);
    } catch (e) { setGenMsg("Generation failed: " + e.message); }
    setGenerating(null);
  }

  function completedCount() {
    return PIPELINE_STAGES.filter(s => stages[s.key]?.status === "complete" || stages[s.key]?.override).length;
  }

  function progressPct() {
    return Math.round((completedCount() / PIPELINE_STAGES.length) * 100);
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>// 05 - DEAL WORKFLOW PIPELINE</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.15em", marginBottom: 6 }}>{completedCount()} OF {PIPELINE_STAGES.length} STAGES COMPLETE ({progressPct()}%)</div>
      <div style={{ height: 4, background: "rgba(16,157,206,0.1)", marginBottom: 20 }}>
        <div style={{ height: "100%", background: CYAN, width: progressPct() + "%", transition: "width 0.5s ease" }}/>
      </div>
      {genMsg && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.1em", marginBottom: 16, padding: "10px 14px", background: "rgba(50,200,122,0.08)", border: "1px solid rgba(50,200,122,0.2)" }}>{genMsg}</div>}

      {PIPELINE_STAGES.map((stage, idx) => {
        const stageData = stages[stage.key];
        const edit = getEdit(stage.key);
        const isExpanded = expanded === stage.key;
        const isOverride = stageData?.override || false;
        const status = stageData?.status || "pending";

        return (
          <div key={stage.key} style={{ background: BG2, border: "1px solid " + (isOverride ? WARN + "66" : status === "complete" ? SAFE + "44" : status === "blocked" ? DANGER + "44" : "rgba(16,157,206,0.15)"), borderLeft: "3px solid " + (isOverride ? WARN : statusColor(status)), padding: "14px 18px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(isExpanded ? null : stage.key)}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em", marginRight: 12, flexShrink: 0 }}>{String(idx + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, color: "#F0F4F6", letterSpacing: "0.05em" }}>{stage.label}</div>
                  <div style={{ fontSize: 11, color: SILVER_DIM, marginTop: 2, fontWeight: 300 }}>{stage.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
                {isOverride && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: WARN, letterSpacing: "0.1em" }}>OVERRIDE</span>}
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: "3px 10px", border: "1px solid " + statusColor(status), color: statusColor(status), background: statusColor(status) + "22", letterSpacing: "0.1em" }}>{statusLabel(status)}</span>
                <span style={{ color: SILVER_DIM, fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(16,157,206,0.15)" }} onClick={e => e.stopPropagation()}>

                {stage.generators.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>GENERATE DOCUMENTS</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {stage.generators.map(gen => (
                        <button key={gen.fn} style={{ padding: "8px 16px", background: "rgba(16,157,206,0.1)", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
                          onClick={() => handleGenerate(gen.fn, stage.key)}
                          disabled={generating === stage.key + gen.fn}>
                          {generating === stage.key + gen.fn ? "GENERATING..." : "⬇ " + gen.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>STAGE STATUS</div>
                <select style={{ background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", appearance: "none", width: "100%", marginBottom: 12 }} value={edit.status} onChange={e => setEdit(stage.key, "status", e.target.value)}>
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace("_", " ").toUpperCase()}</option>)}
                </select>

                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>DOCUMENT REFERENCE</div>
                <input style={{ width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 12 }} value={edit.document_ref} onChange={e => setEdit(stage.key, "document_ref", e.target.value)} placeholder="Document ID or reference number"/>

                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>NOTES</div>
                <textarea style={{ width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "10px 12px", minHeight: 70, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300, marginBottom: 12 }} value={edit.notes} onChange={e => setEdit(stage.key, "notes", e.target.value)} placeholder="Add context, verification details, or stage notes..."/>

                <div style={{ background: "rgba(224,168,50,0.06)", border: "1px solid rgba(224,168,50,0.2)", padding: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: WARN, letterSpacing: "0.15em", marginBottom: 8 }}>OVERRIDE CONTROLS</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <input type="checkbox" checked={edit.override} onChange={e => setEdit(stage.key, "override", e.target.checked)} id={"override-" + stage.key}/>
                    <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em" }} htmlFor={"override-" + stage.key}>MARK THIS STAGE AS OVERRIDDEN</label>
                  </div>
                  {edit.override && (
                    <>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.15em", marginBottom: 6 }}>OVERRIDE REASON</div>
                      <input style={{ width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", boxSizing: "border-box", marginBottom: 8 }} value={edit.override_reason} onChange={e => setEdit(stage.key, "override_reason", e.target.value)} placeholder="e.g. KYC verified through HSBC directly"/>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.15em", marginBottom: 6 }}>AUTHORIZING PARTY</div>
                      <input style={{ width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", boxSizing: "border-box" }} value={edit.override_authority} onChange={e => setEdit(stage.key, "override_authority", e.target.value)} placeholder="e.g. Patrick Lendo, Managing Director"/>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {stage.docs.map(doc => <span key={doc} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, padding: "3px 8px", border: "1px solid rgba(16,157,206,0.2)", color: SILVER_DIM, letterSpacing: "0.08em" }}>{doc}</span>)}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ padding: "10px 24px", background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => saveStage(stage.key)} disabled={saving}>{saving ? "SAVING..." : "SAVE STAGE"}</button>
                  <button style={{ padding: "10px 18px", background: "transparent", border: "1px solid rgba(210,221,225,0.15)", color: SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={() => { setExpanded(null); setEditState(e => { const n = {...e}; delete n[stage.key]; return n; }); }}>CANCEL</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
