import { useState } from "react";
import { C, ASSESSMENT_QUESTIONS, TX_TYPES, REL_SOURCES } from "./theme";

export default function Assessment({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState({ name: "", country: "", txType: "", txValue: "", relSource: "", notes: "", projectName: "", projectValue: "", commodities: "" });
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = ASSESSMENT_QUESTIONS.length + 1;

  function setEntityField(k, v) { setEntity(e => ({ ...e, [k]: v })); }
  function setAnswer(key, value) { setAnswers(a => ({ ...a, [key]: value })); }
  function toggleMulti(key, option) {
    const current = answers[key] || [];
    if (current.includes(option)) setAnswer(key, current.filter(x => x !== option));
    else setAnswer(key, [...current, option]);
  }

  function canProceed() {
    if (step === 0) return entity.name.trim() && entity.country.trim() && entity.txType;
    return true;
  }

  async function generateAssessment() {
    setGenerating(true); setError("");
    const answerSummary = ASSESSMENT_QUESTIONS.map(dim => {
      const dimAnswers = dim.questions.map(q => {
        const val = answers[q.key];
        if (!val && val !== false) return `${q.label}: Not answered`;
        if (q.type === "multiselect") return `${q.label}: ${Array.isArray(val) ? val.join(", ") : "None selected"}`;
        return `${q.label}: ${val}`;
      }).join("\n");
      return `${dim.label} (Weight ${Math.round(dim.weight * 100)}%):\n${dimAnswers}`;
    }).join("\n\n");

    const systemPrompt = `You are the AI risk engine for Revolution INTELL's TRM platform. You analyze counterparty verification data for cross-border commodity transactions and produce institutional-grade trust and risk assessments. Do not use dashes anywhere in your response. Be precise, professional, and evidence-based.`;

    const prompt = `Analyze this counterparty verification data and produce a comprehensive Trust and Risk Assessment.

COUNTERPARTY: ${entity.name}
JURISDICTION: ${entity.country}
TRANSACTION TYPE: ${entity.txType}
TRANSACTION VALUE: ${entity.txValue || "Not disclosed"}
RELATIONSHIP SOURCE: ${entity.relSource || "Not specified"}
PROJECT NAME: ${entity.projectName || "Not specified"}
COMMODITIES: ${entity.commodities || "Not specified"}
ANALYST NOTES: ${entity.notes || "None"}

VERIFICATION DATA:
${answerSummary}

Based on this factual verification data, calculate weighted dimension scores and produce a comprehensive assessment.

Dimension weights:
Identity Verification: 25%
Documentation Integrity: 20%
Transaction History: 20%
Source Credibility: 15%
Advance Fee Risk: 12%
Jurisdictional Compliance: 8%

For each dimension score from 0 to 100 based on the answers provided. Then calculate the weighted composite score.

Respond ONLY with valid JSON no markdown no backticks:
{
  "composite_score": <0-100 integer>,
  "dimension_scores": {
    "identity": <0-100>,
    "documentation": <0-100>,
    "history": <0-100>,
    "source": <0-100>,
    "advancefee": <0-100>,
    "jurisdiction": <0-100>
  },
  "transaction_safety_index": "<CRITICAL|LOW|MODERATE|ELEVATED|HIGH>",
  "strategic_assessment": "<3-4 sentence professional risk analysis>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "critical_gaps": ["<gap 1>", "<gap 2>"],
  "flags": [
    {"level": "red", "text": "<specific risk observation>"},
    {"level": "yellow", "text": "<specific caution>"},
    {"level": "green", "text": "<positive finding>"}
  ],
  "recommendation": "<PROCEED|PROCEED WITH CONDITIONS|HOLD PENDING VERIFICATION|DO NOT PROCEED>",
  "recommendation_detail": "<2-3 sentence concrete action recommendation>",
  "required_actions": ["<action 1>", "<action 2>", "<action 3>"]
}`;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      onComplete({ entity, answers, result: parsed });
    } catch (e) {
      setError("Assessment failed: " + e.message);
      setGenerating(false);
    }
  }

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" };
  const sel = { width: "100%", background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 14, padding: "11px 14px", outline: "none", appearance: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7, marginTop: 14 };
  const seclbl = { fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 };

  const currentDim = step > 0 ? ASSESSMENT_QUESTIONS[step - 1] : null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
      <style>{`*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}select option{background:#0D1219}`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: `1px solid ${C.cyanBorder}`, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em" }}>REVOLUTION INTELL</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginTop: 2 }}>TRM // COUNTERPARTY ASSESSMENT</div>
          </div>
          <button style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={onCancel}>CANCEL</button>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em" }}>STEP {step + 1} OF {totalSteps}</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em" }}>{Math.round(((step) / totalSteps) * 100)}% COMPLETE</span>
          </div>
          <div style={{ height: 3, background: "rgba(16,157,206,0.1)" }}>
            <div style={{ height: "100%", background: C.cyan, width: `${((step) / totalSteps) * 100}%`, transition: "width 0.3s ease" }}/>
          </div>
        </div>

        {step === 0 && (
          <div>
            <div style={seclbl}>// 01 - ENTITY IDENTIFICATION</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700, color: C.white, marginBottom: 8 }}>Counterparty Details</div>
            <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, lineHeight: 1.6, marginBottom: 28 }}>Enter the basic details of the counterparty you are assessing. The TRM will guide you through a structured verification questionnaire and automatically generate a scored risk report.</div>

            <label style={lbl}>Counterparty Name *</label>
            <input style={inp} value={entity.name} onChange={e => setEntityField("name", e.target.value)} placeholder="Company or individual name"/>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Jurisdiction / Country *</label>
                <input style={inp} value={entity.country} onChange={e => setEntityField("country", e.target.value)} placeholder="e.g. UAE, Ghana, DRC"/>
              </div>
              <div>
                <label style={lbl}>Transaction Type *</label>
                <select style={sel} value={entity.txType} onChange={e => setEntityField("txType", e.target.value)}>
                  <option value="">Select type</option>
                  {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Estimated Value (USD)</label>
                <input style={inp} value={entity.txValue} onChange={e => setEntityField("txValue", e.target.value)} placeholder="e.g. $50,000,000"/>
              </div>
              <div>
                <label style={lbl}>Relationship Source</label>
                <select style={sel} value={entity.relSource} onChange={e => setEntityField("relSource", e.target.value)}>
                  <option value="">How introduced?</option>
                  {REL_SOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <label style={lbl}>Project Name (if applicable)</label>
            <input style={inp} value={entity.projectName} onChange={e => setEntityField("projectName", e.target.value)} placeholder="e.g. PR12117 Lubumbashi Copper Cobalt Project"/>
            <label style={lbl}>Primary Commodities</label>
            <input style={inp} value={entity.commodities} onChange={e => setEntityField("commodities", e.target.value)} placeholder="e.g. Copper, Cobalt, Gold"/>
            <label style={lbl}>Analyst Notes</label>
            <textarea style={{ ...inp, minHeight: 80, resize: "vertical", fontWeight: 300 }} value={entity.notes} onChange={e => setEntityField("notes", e.target.value)} placeholder="Any additional context about this counterparty or transaction..."/>
          </div>
        )}

        {step > 0 && currentDim && (
          <div>
            <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(16,157,206,0.1)", border: `1px solid ${C.cyanBorder}`, fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 16 }}>
              DIMENSION {step} OF {ASSESSMENT_QUESTIONS.length} // WEIGHT {Math.round(currentDim.weight * 100)}%
            </div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700, color: C.white, marginBottom: 8 }}>{currentDim.label}</div>
            <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, lineHeight: 1.6, marginBottom: 28 }}>Answer each question based on verified facts only. The AI will use these answers to automatically calculate this dimension score.</div>

            {currentDim.questions.map(q => (
              <div key={q.key} style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 18, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 400, marginBottom: 12, lineHeight: 1.5 }}>{q.label}</div>

                {(q.type === "yn" || q.type === "yn_reverse") && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {["Yes", "No", "Unknown"].map(opt => (
                      <button key={opt} onClick={() => setAnswer(q.key, opt)}
                        style={{ flex: 1, padding: "10px", background: answers[q.key] === opt ? (opt === "Yes" ? "rgba(50,200,122,0.15)" : opt === "No" ? "rgba(224,82,82,0.15)" : "rgba(224,168,50,0.15)") : "transparent",
                          border: `1px solid ${answers[q.key] === opt ? (opt === "Yes" ? C.safe : opt === "No" ? C.danger : C.warn) : "rgba(210,221,225,0.15)"}`,
                          color: answers[q.key] === opt ? (opt === "Yes" ? C.safe : opt === "No" ? C.danger : C.warn) : C.silverDim,
                          fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" }}>
                        {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "select" && (
                  <select style={sel} value={answers[q.key] || ""} onChange={e => setAnswer(q.key, e.target.value)}>
                    <option value="">Select an option</option>
                    {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {q.type === "multiselect" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {q.options.map(o => {
                      const selected = (answers[q.key] || []).includes(o);
                      return (
                        <button key={o} onClick={() => toggleMulti(q.key, o)}
                          style={{ padding: "6px 12px", background: selected ? "rgba(16,157,206,0.15)" : "transparent", border: `1px solid ${selected ? C.cyan : "rgba(210,221,225,0.15)"}`, color: selected ? C.cyan : C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.1em", cursor: "pointer" }}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.danger, letterSpacing: "0.1em", margin: "16px 0" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.cyanBorder}` }}>
          <button style={{ padding: "12px 24px", background: "transparent", border: `1px solid rgba(210,221,225,0.2)`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.4 : 1 }}
            onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            PREVIOUS
          </button>

          {step < totalSteps - 1 ? (
            <button style={{ padding: "12px 32px", background: "transparent", border: `1px solid ${canProceed() ? C.cyan : "rgba(210,221,225,0.2)"}`, color: canProceed() ? C.cyan : C.silverDim, fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: canProceed() ? "pointer" : "not-allowed" }}
              onClick={() => canProceed() && setStep(s => s + 1)}>
              NEXT DIMENSION
            </button>
          ) : (
            <button style={{ padding: "12px 32px", background: "rgba(16,157,206,0.1)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: generating ? "not-allowed" : "pointer" }}
              onClick={generateAssessment} disabled={generating}>
              {generating ? "GENERATING ASSESSMENT..." : "GENERATE TRUST REPORT"}
            </button>
          )}
        </div>

        {generating && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 40, height: 40, border: `2px solid ${C.cyanBorder}`, borderTopColor: C.cyan, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }}/>
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.cyan, letterSpacing: "0.2em" }}>RUNNING AI TRUST ASSESSMENT...</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginTop: 8 }}>REVOLUTION INTELL TRM ENGINE</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
