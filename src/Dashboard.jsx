import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C, PIPELINE_STAGES } from "./theme";

export default function Dashboard({ counterparties, profile, companySettings, workspace, setView, setActiveCP }) {

  const [stageData, setStageData] = useState({});
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (counterparties.length) loadDashboardData();
    else setLoading(false);
  }, [counterparties]);

  async function loadDashboardData() {
    setLoading(true);
    const ids = counterparties.map(cp => cp.id);

    const [stagesRes, notesRes] = await Promise.all([
      supabase.from("deal_stages").select("*").in("counterparty_id", ids),
      supabase.from("notes").select("*, profiles(email, full_name), counterparties(name, id)")
        .in("counterparty_id", ids)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

    if (stagesRes.data) {
      const map = {};
      stagesRes.data.forEach(s => {
        if (!map[s.counterparty_id]) map[s.counterparty_id] = {};
        map[s.counterparty_id][s.stage] = s;
      });
      setStageData(map);
    }

    if (notesRes.data) setRecentNotes(notesRes.data);
    setLoading(false);
  }

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function getProgress(cpId) {
    const stages = stageData[cpId] || {};
    const completed = PIPELINE_STAGES.filter(s => stages[s.key]?.status === "complete" || stages[s.key]?.override).length;
    const inProgress = PIPELINE_STAGES.find(s => stages[s.key]?.status === "in_progress");
    const pct = Math.round((completed / PIPELINE_STAGES.length) * 100);
    return { completed, total: PIPELINE_STAGES.length, pct, currentStage: inProgress?.label || (completed > 0 ? "Stage " + completed + " Complete" : "Not Started") };
  }

  function progressColor(pct) {
    if (pct >= 80) return C.safe;
    if (pct >= 40) return C.cyan;
    if (pct > 0) return C.warn;
    return C.silverDim;
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }

  function getDisplayName(p) {
    if (!p) return "Unknown";
    return p.full_name || p.email?.split("@")[0] || "Unknown";
  }

  function getInitials(p) {
    if (!p) return "?";
    if (p.full_name) return p.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return (p.email || "?").slice(0, 2).toUpperCase();
  }

  const assessed = counterparties.filter(cp => cp.score);
  const avgScore = assessed.length ? Math.round(assessed.reduce((a, b) => a + (b.score || 0), 0) / assessed.length) : 0;
  const highRisk = assessed.filter(cp => cp.score < 40).length;
  const highTrust = assessed.filter(cp => cp.score >= 80).length;

  const statCard = (label, value, color, sub) => (
    <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: "18px 20px" }}>
      <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: C.fontDisplay, fontSize: 38, fontWeight: 700, color: color || C.cyan, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.1em", marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 4 }}>// DASHBOARD</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700, color: C.white }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </div>
        <div style={{ fontSize: 12, color: C.silverDim, fontWeight: 300, marginTop: 2 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {statCard("TOTAL COUNTERPARTIES", counterparties.length, C.cyan)}
        {statCard("AVERAGE TRUST SCORE", avgScore || "—", avgScore >= 80 ? C.safe : avgScore >= 40 ? C.warn : C.danger, avgScore ? (avgScore >= 80 ? "HIGH TRUST" : avgScore >= 60 ? "MODERATE" : avgScore >= 40 ? "ELEVATED RISK" : "HIGH RISK") : "NO ASSESSMENTS YET")}
        {statCard("HIGH RISK", highRisk, C.danger, "SCORE BELOW 40")}
        {statCard("HIGH TRUST", highTrust, C.safe, "SCORE ABOVE 80")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em" }}>// DEAL PIPELINE</div>
            <button style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, background: "transparent", border: `1px solid ${C.cyanBorder}`, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }} onClick={() => setView("workflow")}>VIEW ALL</button>
          </div>

          {counterparties.length === 0 && (
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "30px 0" }}>NO ACTIVE DEALS</div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {counterparties.slice(0, 5).map(cp => {
              const prog = getProgress(cp.id);
              const pc = progressColor(prog.pct);
              return (
                <div key={cp.id} style={{ cursor: "pointer", padding: "12px 14px", background: C.bg, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${pc}` }}
                  onClick={() => { setActiveCP(cp); setView("counterparty-detail"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 2 }}>{cp.name}</div>
                      <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>{prog.currentStage.toUpperCase()}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                      {cp.score && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: scoreColor(cp.score) }}>{cp.score}</div>
                          <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.silverDim }}>TRUST</div>
                        </div>
                      )}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: pc }}>{prog.pct}%</div>
                        <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.silverDim }}>DONE</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "rgba(210,221,225,0.08)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: prog.pct + "%", background: pc, borderRadius: 2, transition: "width 0.8s ease" }}/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim }}>{prog.completed}/{prog.total} STAGES</div>
                    {cp.tx_type && <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim }}>{cp.tx_type}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {counterparties.length > 0 && (
            <button style={{ width: "100%", marginTop: 12, padding: "8px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
              onClick={() => setView("counterparties")}>
              + NEW COUNTERPARTY ASSESSMENT
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 16 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em" }}>// TEAM NOTES</div>
              <button style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, background: "transparent", border: `1px solid ${C.cyanBorder}`, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }} onClick={() => setView("counterparties")}>VIEW ALL</button>
            </div>

            {recentNotes.length === 0 && (
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "30px 0" }}>NO TEAM NOTES YET</div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {recentNotes.map(note => (
                <div key={note.id}
                  style={{ padding: "10px 14px", background: C.bg, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${note.mentions?.length > 0 ? C.warn : C.cyan}`, cursor: "pointer" }}
                  onClick={() => { const cp = counterparties.find(c => c.id === note.counterparty_id); if (cp) { setActiveCP(cp); setView("counterparty-detail"); } }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(16,157,206,0.15)", border: `1px solid ${C.cyan}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fontMono, fontSize: 9, color: C.cyan, flexShrink: 0 }}>
                        {getInitials(note.profiles)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.white }}>{getDisplayName(note.profiles)}</div>
                        <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.cyan, letterSpacing: "0.08em" }}>{note.counterparties?.name || "Unknown"}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, flexShrink: 0 }}>{timeAgo(note.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.silverDim, fontWeight: 300, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 12 }}>// QUICK ACTIONS</div>
            <div style={{ display: "grid", gap: 8 }}>
              <button style={{ width: "100%", padding: "10px", background: "rgba(16,157,206,0.08)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer" }}
                onClick={() => setView("assessment")}>
                + NEW COUNTERPARTY ASSESSMENT
              </button>
              <button style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
                onClick={() => setView("ai-security")}>
                ▶ AI SECURITY SCAN
              </button>
              <button style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
                onClick={() => setView("workflow")}>
                VIEW DEAL PIPELINE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
