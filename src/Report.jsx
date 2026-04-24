import { C, ASSESSMENT_QUESTIONS } from "./theme";

const RECOMMENDATION_COLORS = {
  "PROCEED": C.safe,
  "PROCEED WITH CONDITIONS": "#90EE90",
  "HOLD PENDING VERIFICATION": C.warn,
  "DO NOT PROCEED": C.danger,
};

export default function Report({ assessment, onBack, onNewAssessment }) {
  const { entity, result } = assessment;

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function flagColor(level) {
    if (level === "red") return C.danger;
    if (level === "yellow") return C.warn;
    return C.safe;
  }

  function flagLabel(level) {
    if (level === "red") return "RISK";
    if (level === "yellow") return "CAUTION";
    return "CLEAR";
  }

  function safetyColor(index) {
    if (index === "HIGH") return C.safe;
    if (index === "ELEVATED") return "#90EE90";
    if (index === "MODERATE") return C.warn;
    if (index === "LOW") return "#E08032";
    return C.danger;
  }

  const dimLabels = {
    identity: "Identity Verification",
    documentation: "Documentation Integrity",
    history: "Transaction History",
    source: "Source Credibility",
    advancefee: "Advance Fee Risk",
    jurisdiction: "Jurisdictional Compliance",
  };

  const recColor = RECOMMENDATION_COLORS[result.recommendation] || C.silverDim;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
      <style>{`*{box-sizing:border-box}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 80px", animation: "fadeUp 0.4s ease" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: `1px solid ${C.cyanBorder}`, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em" }}>REVOLUTION INTELL</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginTop: 2 }}>TRM // TRUST ASSESSMENT REPORT</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={onBack}>BACK</button>
            <button style={{ padding: "7px 16px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={onNewAssessment}>NEW ASSESSMENT</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20, gridColumn: "1" }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>COMPOSITE TRUST SCORE</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 56, fontWeight: 700, color: scoreColor(result.composite_score), lineHeight: 1 }}>{result.composite_score}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: scoreColor(result.composite_score), letterSpacing: "0.1em", marginTop: 4 }}>/100</div>
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>TRANSACTION SAFETY INDEX</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700, color: safetyColor(result.transaction_safety_index), lineHeight: 1.2 }}>{result.transaction_safety_index}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.1em", marginTop: 8 }}>SAFETY RATING</div>
          </div>
          <div style={{ background: C.bg2, border: `1px solid ${recColor}33`, padding: 20 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>RECOMMENDATION</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 16, fontWeight: 700, color: recColor, lineHeight: 1.3 }}>{result.recommendation}</div>
          </div>
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid rgba(16,157,206,0.15)` }}>
            <div>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.2em", marginBottom: 6 }}>COUNTERPARTY</div>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 24, fontWeight: 600, color: C.white }}>{entity.name}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, marginTop: 4 }}>{[entity.country, entity.txType, entity.txValue].filter(Boolean).join(" // ")}</div>
              {entity.projectName && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, marginTop: 4 }}>{entity.projectName}</div>}
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, textAlign: "right" }}>
              <div>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
              <div style={{ marginTop: 4 }}>RI-TRM-{Date.now().toString(36).toUpperCase()}</div>
            </div>
          </div>

          <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.2em", marginBottom: 12 }}>DIMENSION BREAKDOWN</div>
          {Object.entries(result.dimension_scores).map(([dim, score]) => (
            <div key={dim} style={{ display: "grid", gridTemplateColumns: "180px 1fr 50px", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>{dimLabels[dim] || dim}</div>
              <div style={{ height: 5, background: "rgba(210,221,225,0.08)" }}>
                <div style={{ height: "100%", width: score + "%", background: scoreColor(score), transition: "width 1s ease" }}/>
              </div>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: scoreColor(score), textAlign: "right" }}>{score}/100</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${C.cyan}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 12, fontWeight: 600, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Strategic Assessment</div>
          <div style={{ fontSize: 13, color: C.silver, lineHeight: 1.75, fontWeight: 300 }}>{result.strategic_assessment}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div style={{ background: C.bg2, border: `1px solid rgba(50,200,122,0.2)`, padding: 20 }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 12, fontWeight: 600, color: C.safe, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Key Strengths</div>
            {(result.key_strengths || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, fontWeight: 300, color: C.silver, lineHeight: 1.5 }}>
                <span style={{ color: C.safe, flexShrink: 0 }}>&#10003;</span>{s}
              </div>
            ))}
          </div>
          <div style={{ background: C.bg2, border: `1px solid rgba(224,82,82,0.2)`, padding: 20 }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 12, fontWeight: 600, color: C.danger, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Critical Gaps</div>
            {(result.critical_gaps || []).map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, fontWeight: 300, color: C.silver, lineHeight: 1.5 }}>
                <span style={{ color: C.danger, flexShrink: 0 }}>&#9679;</span>{g}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${C.cyan}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 12, fontWeight: 600, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Risk Flags & Observations</div>
          {(result.flags || []).map((flag, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 300, lineHeight: 1.5, marginBottom: 8 }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "2px 6px", flexShrink: 0, marginTop: 2, border: `1px solid ${flagColor(flag.level)}`, background: flagColor(flag.level) + "33", color: flagColor(flag.level) }}>{flagLabel(flag.level)}</span>
              <span style={{ color: C.silver }}>{flag.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${recColor}44`, borderLeft: `3px solid ${recColor}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 12, fontWeight: 600, color: recColor, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Recommended Action: {result.recommendation}</div>
          <div style={{ fontSize: 13, color: C.silver, lineHeight: 1.75, fontWeight: 300, marginBottom: 14 }}>{result.recommendation_detail}</div>
          {(result.required_actions || []).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, fontWeight: 300, color: C.silver, lineHeight: 1.5 }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 9, color: recColor, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>{a}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: `1px solid ${C.cyanBorder}`, marginTop: 20 }}>
          <div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>REVOLUTION INTELL // TRM PLATFORM v2.0</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, marginTop: 3 }}>CONFIDENTIAL // FOR AUTHORIZED USE ONLY</div>
          </div>
          <button style={{ padding: "8px 20px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={() => window.print()}>EXPORT REPORT</button>
        </div>
      </div>
    </div>
  );
}
