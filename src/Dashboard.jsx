import { C } from "./theme";

export default function Dashboard({ counterparties, profile, companySettings, workspace, setView, setActiveCP }) {

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function verdictLabel(s) {
    if (s >= 80) return "HIGH TRUST";
    if (s >= 60) return "MODERATE";
    if (s >= 40) return "ELEVATED RISK";
    return "HIGH RISK";
  }

  const assessed = counterparties.filter(cp => cp.score);
  const avgScore = assessed.length ? Math.round(assessed.reduce((a, b) => a + (b.score || 0), 0) / assessed.length) : 0;
  const highRisk = assessed.filter(cp => cp.score < 40).length;
  const highTrust = assessed.filter(cp => cp.score >= 80).length;
  const recent = [...counterparties].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);

  const statCard = (label, value, color, sub) => (
    <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: "20px 24px" }}>
      <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: C.fontDisplay, fontSize: 42, fontWeight: 700, color: color || C.cyan, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.1em", marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// DASHBOARD</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
        {statCard("TOTAL COUNTERPARTIES", counterparties.length, C.cyan)}
        {statCard("AVERAGE TRUST SCORE", avgScore || "—", avgScore >= 80 ? C.safe : avgScore >= 40 ? C.warn : C.danger, avgScore ? verdictLabel(avgScore) : "NO ASSESSMENTS YET")}
        {statCard("HIGH RISK", highRisk, C.danger, "SCORE BELOW 40")}
        {statCard("HIGH TRUST", highTrust, C.safe, "SCORE ABOVE 80")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// RECENT ACTIVITY</div>
          {recent.length === 0 && (
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "24px 0" }}>NO COUNTERPARTIES YET</div>
          )}
          {recent.map(cp => (
            <div key={cp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid rgba(16,157,206,0.08)`, cursor: "pointer" }}
              onClick={() => { setActiveCP(cp); setView("counterparty-detail"); }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.white, marginBottom: 2 }}>{cp.name}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.08em" }}>{cp.tx_type || "No transaction type"} // {new Date(cp.updated_at).toLocaleDateString()}</div>
              </div>
              {cp.score && (
                <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: scoreColor(cp.score) }}>{cp.score}</div>
              )}
            </div>
          ))}
          <button style={{ marginTop: 16, padding: "8px 16px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer", width: "100%" }}
            onClick={() => setView("counterparties")}>VIEW ALL COUNTERPARTIES</button>
        </div>

        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// TRUST DISTRIBUTION</div>
          {assessed.length === 0 && (
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "24px 0" }}>RUN ASSESSMENTS TO SEE DISTRIBUTION</div>
          )}
          {[
            { label: "HIGH TRUST (80-100)", count: assessed.filter(cp => cp.score >= 80).length, color: C.safe },
            { label: "MODERATE (60-79)", count: assessed.filter(cp => cp.score >= 60 && cp.score < 80).length, color: "#90EE90" },
            { label: "ELEVATED RISK (40-59)", count: assessed.filter(cp => cp.score >= 40 && cp.score < 60).length, color: C.warn },
            { label: "HIGH RISK (0-39)", count: assessed.filter(cp => cp.score < 40).length, color: C.danger },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: C.fontMono, fontSize: 9, color: item.color, letterSpacing: "0.1em" }}>{item.label}</span>
                <span style={{ fontFamily: C.fontMono, fontSize: 9, color: item.color }}>{item.count}</span>
              </div>
              <div style={{ height: 4, background: "rgba(210,221,225,0.08)" }}>
                <div style={{ height: "100%", width: assessed.length ? `${(item.count / assessed.length) * 100}%` : "0%", background: item.color, transition: "width 1s ease" }}/>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid rgba(16,157,206,0.1)` }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 12 }}>// QUICK ACTIONS</div>
            <button style={{ width: "100%", padding: "10px", background: "rgba(16,157,206,0.08)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", marginBottom: 8 }}
              onClick={() => setView("assessment")}>
              + NEW COUNTERPARTY ASSESSMENT
            </button>
            <button style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
              onClick={() => setView("workflow")}>
              VIEW DEAL PIPELINE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
