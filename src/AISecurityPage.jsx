import { useState, useRef } from "react";
import { C } from "./theme";

const SOURCES = ["Email", "WhatsApp", "SMS", "LinkedIn", "PDF Document", "Word Document", "Letter", "Contract", "Other"];

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

async function extractTextFromFile(file) {
  if (file.type === "text/plain") {
    return await file.text();
  }
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(uint8Array);
    const streamMatches = raw.match(/stream[\r\n]([\s\S]*?)[\r\n]endstream/g) || [];
    streamMatches.forEach(stream => {
      const inner = stream.replace(/^stream[\r\n]/, "").replace(/[\r\n]endstream$/, "");
      const printable = inner.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      if (printable.length > 20) text += printable + "\n";
    });
    const btMatches = raw.match(/BT[\s\S]*?ET/g) || [];
    btMatches.forEach(bt => {
      const tjMatches = bt.match(/\((.*?)\)\s*Tj/g) || [];
      tjMatches.forEach(tj => {
        const extracted = tj.replace(/\((.*?)\)\s*Tj/, "$1").replace(/\\n/g, "\n").replace(/\\r/g, "").trim();
        if (extracted.length > 2) text += extracted + " ";
      });
    });
    if (!text.trim()) {
      text = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim().slice(0, 8000);
    }
    return text.trim() || "PDF content could not be fully extracted. Please paste the text manually for best results.";
  }
  if (file.type.includes("officedocument") || file.name.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(uint8Array);
    const matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const text = matches.map(m => m.replace(/<[^>]+>/g, "")).join(" ").replace(/\s+/g, " ").trim();
    return text || "Document text could not be extracted. Please paste the text manually.";
  }
  if (file.type.startsWith("image/")) {
    return `[IMAGE FILE: ${file.name}] - Image uploaded for analysis. Please also paste any visible text from the image for more accurate screening.`;
  }
  return await file.text().catch(() => "File content could not be extracted. Please paste the text manually.");
}

export default function AISecurityPage() {
  const [content, setContent] = useState("");
  const [source, setSource] = useState("Email");
  const [sender, setSender] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  function quickScan(text) {
    const lower = text.toLowerCase();
    return RISK_KEYWORDS.filter(p => lower.includes(p));
  }

  async function handleFileUpload(file) {
    if (!file) return;
    setExtracting(true);
    setUploadedFile(file);
    setError("");
    try {
      const text = await extractTextFromFile(file);
      setContent(text);
      if (file.name.toLowerCase().includes(".pdf")) setSource("PDF Document");
      else if (file.name.toLowerCase().includes(".doc")) setSource("Word Document");
    } catch (e) {
      setError("Could not extract text from file. Please paste the content manually.");
    }
    setExtracting(false);
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFileUpload(file);
  }

  async function analyze() {
    if (!content.trim()) { setError("Please paste or upload content to analyze."); return; }
    setError(""); setAnalyzing(true); setResult(null);
    const quickFlags = quickScan(content);
    const prompt = `You are the AI security engine for Revolution INTELL's TRM platform. Analyze this correspondence for fraud, advance fee scams, AML red flags, and counterparty risk signals in cross-border commodity and financial transactions. Do not use dashes anywhere.

SOURCE: ${source}
SENDER: ${sender || "Unknown"}
FILE: ${uploadedFile ? uploadedFile.name : "Text input"}
QUICK SCAN KEYWORDS FOUND: ${quickFlags.length > 0 ? quickFlags.join(", ") : "None"}
CONTENT:
${content.slice(0, 6000)}

Analyze for: advance fee fraud, urgency tactics, identity inconsistencies, unrealistic promises, AML signals, document authenticity, jurisdiction risk, communication channel risk.

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
      const scanResult = { ...parsed, source, sender, content: content.slice(0, 200) + "...", fileName: uploadedFile?.name, timestamp: new Date().toISOString(), quickFlags };
      setResult(scanResult);
      setHistory(h => [scanResult, ...h.slice(0, 4)]);
    } catch (e) {
      setError("Analysis failed: " + e.message);
    }
    setAnalyzing(false);
  }

  function reset() { setResult(null); setContent(""); setSender(""); setError(""); setUploadedFile(null); }

  const inp = { width: "100%", background: C.bg2, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box" };
  const sel = { ...inp, appearance: "none", cursor: "pointer" };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// AI SECURITY ENGINE</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>Correspondence Security Scanner</div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>Upload any document or paste text to instantly scan for fraud, advance fee patterns, AML red flags, and counterparty risk signals.</div>
      </div>

      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// UPLOAD OR PASTE CONTENT</div>

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

              <div
                style={{ border: `2px dashed ${dragOver ? C.cyan : C.cyanBorder}`, background: dragOver ? "rgba(16,157,206,0.05)" : C.bg, padding: "20px", textAlign: "center", cursor: "pointer", marginBottom: 14, transition: "all 0.2s" }}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}>
                <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.eml,.msg" onChange={e => handleFileUpload(e.target.files[0])}/>
                {extracting ? (
                  <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.15em" }}>EXTRACTING TEXT...</div>
                ) : uploadedFile ? (
                  <div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.safe, letterSpacing: "0.1em", marginBottom: 4 }}>FILE LOADED</div>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{uploadedFile.name}</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, marginTop: 4 }}>{(uploadedFile.size / 1024).toFixed(1)} KB // Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>&#8679;</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.15em", marginBottom: 4 }}>DRAG AND DROP OR CLICK TO UPLOAD</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>PDF, Word, TXT, Images, Email files supported</div>
                  </div>
                )}
              </div>

              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 6 }}>OR PASTE TEXT DIRECTLY</div>
              <textarea style={{ ...inp, minHeight: 160, resize: "vertical", fontWeight: 300, lineHeight: 1.6, marginBottom: 12 }} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste email, message, contract text, or any communication to scan..."/>

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
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// SUPPORTED FILE TYPES</div>
              {[
                { icon: "📄", label: "PDF Documents", desc: "Contracts, letters, bank instruments, supplier agreements, SKRs" },
                { icon: "📝", label: "Word Documents", desc: "LOIs, NDAs, SPAs, internal memos, correspondence" },
                { icon: "📧", label: "Email Text", desc: "Paste full email content including headers and signature" },
                { icon: "💬", label: "WhatsApp and SMS", desc: "Paste message threads from any messaging platform" },
                { icon: "🖼", label: "Images", desc: "Scanned documents, screenshots of messages or contracts" },
                { icon: "📋", label: "Plain Text", desc: "Any text content from any source" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(16,157,206,0.08)" }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.1em", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.silverDim, fontWeight: 300, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 12 }}>// RECENT SCANS</div>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(16,157,206,0.08)", cursor: "pointer" }} onClick={() => setResult(h)}>
                    <div>
                      <div style={{ fontSize: 12, color: C.silver }}>{h.fileName || h.sender || "Text scan"} via {h.source}</div>
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
              {result.fileName && <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, marginTop: 8, letterSpacing: "0.08em" }}>FILE: {result.fileName}</div>}
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
