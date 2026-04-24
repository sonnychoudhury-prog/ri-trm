import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const WARN = "#E0A832";
const DANGER = "#E05252";

const SOURCES = ["Email", "WhatsApp", "Call Notes", "Meeting Notes", "Document", "Other"];

export default function Correspondence({ counterpartyId, counterpartyName, userId }) {
  const [logs, setLogs] = useState([]);
  const [content, setContent] = useState("");
  const [source, setSource] = useState("Email");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadLogs(); }, [counterpartyId]);

  async function deleteLog(id) {
    await supabase.from("correspondence").delete().eq("id", id);
    loadLogs();
  }

  async function loadLogs() {
    const { data } = await supabase.from("correspondence").select("*").eq("counterparty_id", counterpartyId).order("created_at", { ascending: false });
    if (data) setLogs(data);
  }

  async function analyzeAndSave() {
    if (!content.trim()) { setError("Please paste in some correspondence first."); return; }
    setError(""); setAnalyzing(true);
    const prompt = `You are the AI risk engine for Revolution INTELL's TRM platform. Analyze this correspondence from counterparty "${counterpartyName}" for risk signals in cross-border commodity transactions. SOURCE: ${source}\nCONTENT:\n${content}\n\nLook for: advance fee requests, urgency tactics, inconsistencies, pressure patterns, vague documentation references, unrealistic promises, AML red flags. Do not use dashes.\n\nRespond ONLY with valid JSON no markdown no backticks: {"analysis":"2-3 sentence summary of what this correspondence reveals","flags":[{"level":"red","text":"observation"},{"level":"yellow","text":"observation"},{"level":"green","text":"observation"}],"risk_signal":"low|medium|high"}`;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, messages: [{ role: "user", content: prompt }] })
      });
      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      await supabase.from("correspondence").insert({
        counterparty_id: counterpartyId, user_id: userId, source, content,
        ai_analysis: parsed.analysis, flags: JSON.stringify(parsed.flags)
      });
      setContent(""); loadLogs();
    } catch (e) { setError("Analysis failed: " + e.message); }
    setAnalyzing(false);
  }

  function flagColor(level) { if (level === "red") return DANGER; if (level === "yellow") return WARN; return SAFE; }
  function flagLabel(level) { if (level === "red") return "RISK"; if (level === "yellow") return "CAUTION"; return "CLEAR"; }

  const s = {
    wrap: { marginTop: 32 },
    sectionLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12 },
    inputBlock: { background: BG2, border: "1px solid rgba(16,157,206,0.22)", padding: 20, marginBottom: 20 },
    label: { display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 },
    select: { background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "9px 12px", outline: "none", marginBottom: 14, appearance: "none", width: 200 },
    textarea: { width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "12px 14px", minHeight: 140, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300, marginBottom: 14 },
    analyzeBtn: { padding: "12px 24px", background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" },
    error: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: DANGER, letterSpacing: "0.1em", marginBottom: 10 },
    logCard: { background: BG2, border: "1px solid rgba(16,157,206,0.15)", padding: 18, marginBottom: 12 },
    logHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    logSource: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.15em" },
    logDate: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em" },
    logContent: { fontSize: 12, color: SILVER_DIM, lineHeight: 1.6, fontWeight: 300, marginBottom: 12, maxHeight: 80, overflow: "hidden", borderLeft: "2px solid rgba(16,157,206,0.2)", paddingLeft: 10 },
    logAnalysis: { fontSize: 13, color: SILVER, lineHeight: 1.7, fontWeight: 300, marginBottom: 10 },
    flagItem: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, marginBottom: 6 },
    flagIcon: (level) => ({ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: "1px 5px", border: "1px solid " + flagColor(level), background: flagColor(level) + "33", color: flagColor(level), flexShrink: 0 }),
    emptyMsg: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SILVER_DIM, letterSpacing: "0.1em", textAlign: "center", padding: "32px 0" },
  };

  return (
    <div style={s.wrap}>
      <div style={s.sectionLabel}>// 04 - CORRESPONDENCE LOG</div>
      <div style={s.inputBlock}>
        <label style={s.label}>Source</label>
        <select style={s.select} value={source} onChange={e => setSource(e.target.value)}>
          {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
        </select>
        <label style={s.label}>Paste Correspondence</label>
        <textarea style={s.textarea} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste email, WhatsApp message, call notes, or any communication from this counterparty here..."/>
        {error && <div style={s.error}>{error}</div>}
        <button style={s.analyzeBtn} onClick={analyzeAndSave} disabled={analyzing}>
          {analyzing ? "ANALYZING..." : "ANALYZE & SAVE"}
        </button>
      </div>
      {logs.length === 0 && <div style={s.emptyMsg}>NO CORRESPONDENCE LOGGED YET</div>}
      {logs.map(log => {
        let flags = [];
        try { flags = JSON.parse(log.flags || "[]"); } catch(e) {}
        return (
          <div key={log.id} style={s.logCard}>
            <div style={s.logHeader}>
              <span style={s.logSource}>{log.source}</span>
              <span style={s.logDate}>{new Date(log.created_at).toLocaleString()}</span>
              <button onClick={() => deleteLog(log.id)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid rgba(224,82,82,0.3)", color: "#E05252", fontFamily: "monospace", fontSize: 9, cursor: "pointer", marginLeft: "auto" }}>DELETE</button>
            </div>
            <div style={s.logContent}>{log.content}</div>
            {log.ai_analysis && <div style={s.logAnalysis}>{log.ai_analysis}</div>}
            {flags.map((flag, i) => (
              <div key={i} style={s.flagItem}>
                <span style={s.flagIcon(flag.level)}>{flagLabel(flag.level)}</span>
                <span style={{ color: SILVER, fontWeight: 300 }}>{flag.text}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
