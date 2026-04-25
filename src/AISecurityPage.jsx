import { useState } from "react";
import { C } from "./theme";

const SOURCES = ["Email", "WhatsApp", "SMS", "LinkedIn", "Document", "Letter", "Other"];

const RISK_KEYWORDS = [
  "advance fee", "upfront payment", "processing fee", "transfer fee", "release fee",
  "act now", "limited time", "urgent", "immediately", "expires today",
  "guaranteed returns", "risk free", "100% profit", "no risk",
  "wire transfer", "western union", "bitcoin", "cryptocurrency",
  "confidential", "strictly private", "do not tell",
  "next of kin", "inheritance", "lottery", "winning", "prize",
  "diplomatic", "customs clearance", "bank account", "routing number"
];

function flagColor(level) {
  if (level === "red") return "#E05252";
  if (level === "yellow") return "#E0A832";
  return "#32C87A";
}

function flagLabel(level) {
  if (level === "red") return "RISK";
  if (level === "yellow") return "CAUTION";
  return "CLEAR";
}

function verdictColor(verdict) {
  if (!verdict) return C.silverDim;
  if (verdict.includes("CRITICAL") || verdict.includes("HIGH")) return "#E05252";
  if (verdict.includes("MODERATE")) return "#E0A832";
  if (verdict.includes("LOW")) return "#90EE90";
  return "#32C87A";
}

export default function AISecurityPage() {
  const [content, setContent] = useState("");
  const [source, setSource] = useState("Email");
  const [sender, setSender] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  function quickScan(text) {
    const lower = text.toLowerCase();
    return RISK_KEYWORDS.filter(p => lower.includes(p));
  }

  async function analyze() {
    if (!content.trim()) { setError("Please paste correspondence to analyze."); return; }
    setError(""); setAnalyzing(true); setResult(null);
    const quickFlags = quickScan(content);
    const prompt = `You are the AI security engine for Revolution INTELL's TRM platform. Analyze this correspondence for fraud, advance fee scams, AML red flags, and counterparty risk signals in cross-border commodity and financial transactions. Do not use dashes anywhere.

SOURCE: ${source}
SENDER: ${sender || "Unknown"}
QUICK SCAN KEYWORDS FOUND: ${quickFlags.length > 0 ? quickFlags.join(", ") : "None"}
CONTENT:
${content}

Respond ONLY with valid JSON no markdown no backticks:
{
  "verdict": "CLEAN|LOW RISK|MODERATE RISK|HIGH RISK|CRITICAL RISK",
  "risk_score": <0-100>,
  "summary": "2-3 sentence executive summary",
  "fraud_patterns": ["pattern 1", "pattern 2"],
  "red_flags": [
    {"level": "red", "text": "critical risk observation"},
    {"level": "yellow", "text": "caution observation"},
    {"level": "green", "text": "positive signal"}
  ],
  "recommended_action": "PROCEED|PROCEED WITH CAUTION|REQUEST VERIFICATION|DO NOT ENGAGE|REPORT TO COMPLIANCE",
  "action_detail": "2-3 sentence specific guidance",
  "counterparty_signals": {
    "credibility": "LOW|MEDIUM|HIGH",
    "authenticity": "SUSPICIOUS|UNVERIFIED|LIKELY LEGITIMATE|VERIFIED",
    "intent": "FRAUDULENT|UNCLEAR|LEGITIMATE"
  }
}`;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are an expert fraud detection and AML compliance analyst. Be precise and evidence-based. Do not use dashes.",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      const scanResult = { ...parsed, source, sender, content, timestamp: new Date().toISOString(), quickFlags };
      setResult(scanResult);
      setHistory(h => [scanResult, ...h.slice(0, 4)]);
    } catch (e) {
      setError("Analysis failed: " + e.message);
    }
    setAnalyzing(false);
  }

  function reset() { setResult(null); setContent(""); setSender(""); setError(""); }

  const inp = { width: "100%", background: C.bg2, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box" };
  const sel = { ...inp, appearance: "none", cursor: "pointer" };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// AI SECURITY ENGINE</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>Correspondence Security Scanner</div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>Paste any email, message, or document to instantly scan for fraud, advance fee patterns, AML red flags, and counterparty risk signals before engaging.</div>
      </div>

      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// PASTE CORRESPONDENCE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 6 }}>SOURCE</div>
                  <select style={sel} value={source} onChange={e => setSource(e.target.value)}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 6 }}>SENDER</div>
                  <input style={inp} value={sender} onChange={e => setSender(e.target.value)} placeholder="Name or email"/>
                </div>
              </div>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 6 }}>CONTENT</div>
              <textarea style={{ ...inp, minHeight: 220, resize: "vertical", fontWeight: 300, lineHeight: 1.6, marginBottom: 12 }} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste the full email, WhatsApp message, letter, or any communication to scan..."/>

              {content && quickScan(content).length > 0 && (
                <div style={{ padding: "8px 12px", background: "rgba(224,82,82,0.06)", border: "1px solid rgba(224,82,82,0.2)", marginBottom: 12 }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: "#E05252", letterSpacing: "0.1em", marginBottom: 6 }}>QUICK SCAN: {quickScan(content).length} RISK KEYWORDS DETECTED</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {quickScan(content).map(k => <span key={k} style={{ fontFamily: C.fontMono, fontSize: 8, padding: "2px 6px", background: "rgba(224,82,82,0.12)", border: "1px solid rgba(224,82,82,0.3)", color: "#E05252" }}>{k}</span>)}
                  </div>
                </div>
              )}

              {error && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: "#E05252", letterSpacing: "0.1em", marginBottom: 10 }}>{error}</div>}

              <button style={{ width: "100%", padding: 14, background: "rgba(16,157,206,0.1)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: analyzing ? "not-allowed" : "pointer" }}
                onClick={analyze} disabled={analyzing}>
                {analyzing ? "SCANNING..." : "▶ RUN AI SECURITY SCAN"}
              </button>

              {analyzing && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em" }}>ANALYZING FOR FRAUD PATTERNS...</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24, marginBottom: 16 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// WHAT WE SCAN FOR</div>
              {[
                { label: "Advance Fee Fraud", desc: "Upfront payments, processing fees, release fees before deal execution" },
                { label: "Urgency Tactics", desc: "Time pressure, limited windows, act now language" },
                { label: "Identity Red Flags", desc: "Impersonation, inconsistent names, mismatched sender info" },
                { label: "Unrealistic Promises", desc: "Guaranteed returns, risk-free investments, impossible yields" },
                { label: "AML Signals", desc: "Sanctions exposure, high risk jurisdictions, unusual payment routes" },
                { label: "Document Integrity", desc: "Fake certifications, unverifiable references, forged claims" },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(16,157,206,0.08)" }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.1em", marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.silverDim, fontWeight: 300, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 12 }}>// RECENT SCANS</div>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(16,157,206,0.08)", cursor: "pointer" }} onClick={() => setResult(h)}>
                    <div>
                      <div style={{ fontSize: 12, color: C.silver }}>{h.sender || "Unknown"} via {h.source}</div>
                      <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, marginTop: 2 }}>{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                    <span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "3px 10px", border: `1px solid ${verdictColor(h.verdict)}`, color: verdictColor(h.verdict) }}>{h.verdict}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ background: C.bg2, border: `2px solid ${verdictColor(result.verdict)}44`, padding: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>SECURITY VERDICT</div>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700, color: verdictColor(result.verdict), marginBottom: 10 }}>{result.verdict}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: "rgba(210,221,225,0.08)" }}>
                  <div style={{ height: "100%", width: result.risk_score + "%", background: verdictColor(result.verdict) }}/>
                </div>
                <span style={{ fontFamily: C.fontMono, fontSize: 10, color: verdictColor(result.verdict) }}>{result.risk_score}/100</span>
              </div>
            </div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 12 }}>COUNTERPARTY SIGNALS</div>
              {Object.entries(result.counterparty_signals || {}).map(([key, val]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, textTransform: "uppercase" }}>{key}</span>
                  <span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "2px 8px", border: `1px solid ${["HIGH","VERIFIED","LEGITIMATE"].includes(val) ? "#32C87A" : ["LOW","FRAUDULENT","SUSPICIOUS"].includes(val) ? "#E05252" : "#E0A832"}`, color: ["HIGH","VERIFIED","LEGITIMATE"].includes(val) ? "#32C87A" : ["LOW","FRAUDULENT","SUSPICIOUS"].includes(val) ? "#E05252" : "#E0A832" }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>RECOMMENDED ACTION</div>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 16, fontWeight: 700, color: result.recommended_action === "PROCEED" ? "#32C87A" : ["DO NOT ENGAGE","REPORT TO COMPLIANCE"].includes(result.recommended_action) ? "#E05252" : "#E0A832", lineHeight: 1.3, marginBottom: 8 }}>{result.recommended_action}</div>
              <div style={{ fontSize: 12, color: C.silverDim, fontWeight: 300, lineHeight: 1.5 }}>{result.action_detail}</div>
            </div>
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${C.cyan}`, padding: 20, marginBottom: 14 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.15em", marginBottom: 10 }}>SECURITY SUMMARY</div>
            <div style={{ fontSize: 13, color: C.silver, lineHeight: 1.75, fontWeight: 300 }}>{result.summary}</div>
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${C.cyan}`, padding: 20, marginBottom: 14 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.15em", marginBottom: 12 }}>RISK FLAGS</div>
            {result.red_flags?.map((flag, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 300, lineHeight: 1.5, marginBottom: 10 }}>
                <span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "2px 6px", flexShrink: 0, border: `1px solid ${flagColor(flag.level)}`, background: flagColor(flag.level) + "33", color: flagColor(flag.level) }}>{flagLabel(flag.level)}</span>
                <span style={{ color: C.silver }}>{flag.text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${C.cyanBorder}` }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>REVOLUTION INTELL // TRM AI SECURITY ENGINE // {new Date(result.timestamp).toLocaleString()}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ padding: "8px 20px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={() => window.print()}>EXPORT</button>
              <button style={{ padding: "8px 20px", background: "transparent", border: "1px solid rgba(210,221,225,0.2)", color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={reset}>NEW SCAN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
