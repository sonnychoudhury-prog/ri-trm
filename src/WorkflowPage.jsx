import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C, PIPELINE_STAGES } from "./theme";

export default function WorkflowPage({ counterparties, setView, setActiveCP }) {
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { loadAllStages(); }, [counterparties]);

  async function loadAllStages() {
    if (!counterparties.length) { setLoading(false); return; }
    const ids = counterparties.map(cp => cp.id);
    const { data } = await supabase.from("deal_stages").select("*").in("counterparty_id", ids);
    if (data) {
      const map = {};
      data.forEach(s => {
        if (!map[s.counterparty_id]) map[s.counterparty_id] = {};
        map[s.counterparty_id][s.stage] = s;
      });
      setStageData(map);
    }
    setLoading(false);
  }

  function getProgress(cpId) {
    const stages = stageData[cpId] || {};
    const completed = PIPELINE_STAGES.filter(s => stages[s.key]?.status === "complete" || stages[s.key]?.override).length;
    return { completed, total: PIPELINE_STAGES.length, pct: Math.round((completed / PIPELINE_STAGES.length) * 100) };
  }

  function getCurrentStage(cpId) {
    const stages = stageData[cpId] || {};
    const inProgress = PIPELINE_STAGES.find(s => stages[s.key]?.status === "in_progress");
    if (inProgress) return inProgress.label;
    const lastComplete = [...PIPELINE_STAGES].reverse().find(s => stages[s.key]?.status === "complete" || stages[s.key]?.override);
    if (lastComplete) return lastComplete.label + " ✓";
    return "Not Started";
  }

  function scoreColor(s) {
    if (!s) return C.silverDim;
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function progressColor(pct) {
    if (pct >= 80) return C.safe;
    if (pct >= 40) return C.cyan;
    return C.warn;
  }

  const filtered = counterparties.filter(cp => {
    if (filterStatus === "active") return getProgress(cp.id).pct > 0 && getProgress(cp.id).pct < 100;
    if (filterStatus === "complete") return getProgress(cp.id).pct === 100;
    if (filterStatus === "not-started") return getProgress(cp.id).pct === 0;
    return true;
  });

  const sel = { background: C.bg2, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "9px 14px", outline: "none", appearance: "none", cursor: "pointer" };

  const stageOverview = PIPELINE_STAGES.map(stage => {
    const count = counterparties.filter(cp => stageData[cp.id]?.[stage.key]?.status === "complete" || stageData[cp.id]?.[stage.key]?.override).length;
    return { ...stage, count };
  });

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// DEAL WORKFLOW</div>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>Pipeline Overview</div>
          <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>{counterparties.length} deals across {PIPELINE_STAGES.length} stages</div>
        </div>
        <select style={sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Deals</option>
          <option value="active">In Progress</option>
          <option value="complete">Completed</option>
          <option value="not-started">Not Started</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 28, overflowX: "auto" }}>
        {stageOverview.map((stage, idx) => (
          <div key={stage.key} style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: "12px 14px" }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 6 }}>{String(idx + 1).padStart(2, "0")}</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 8, lineHeight: 1.2 }}>{stage.label}</div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 24, fontWeight: 700, color: stage.count > 0 ? C.cyan : C.silverDim }}>{stage.count}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.08em" }}>COMPLETED</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "40px 0" }}>LOADING PIPELINE DATA...</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>No Deals in Pipeline</div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em" }}>ADD COUNTERPARTIES AND START WORKFLOW STAGES TO TRACK YOUR DEALS</div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(cp => {
          const prog = getProgress(cp.id);
          const currentStage = getCurrentStage(cp.id);
          const pc = progressColor(prog.pct);
          return (
            <div key={cp.id} style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: "18px 20px", cursor: "pointer" }}
              onClick={() => { setActiveCP(cp); setView("counterparty-detail"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: C.fontDisplay, fontSize: 17, fontWeight: 600, color: C.white, marginBottom: 4 }}>{cp.name}</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {cp.country && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>&#127758; {cp.country}</span>}
                    {cp.tx_type && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>&#9670; {cp.tx_type}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  {cp.score && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: C.fontDisplay, fontSize: 24, fontWeight: 700, color: scoreColor(cp.score) }}>{cp.score}</div>
                      <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.silverDim }}>TRUST</div>
                    </div>
                  )}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: C.fontDisplay, fontSize: 24, fontWeight: 700, color: pc }}>{prog.pct}%</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.silverDim }}>COMPLETE</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: C.fontMono, fontSize: 9, color: pc, letterSpacing: "0.1em" }}>{currentStage.toUpperCase()}</span>
                  <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>{prog.completed}/{prog.total} STAGES</span>
                </div>
                <div style={{ height: 4, background: "rgba(210,221,225,0.08)" }}>
                  <div style={{ height: "100%", width: prog.pct + "%", background: pc, transition: "width 0.5s ease" }}/>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {PIPELINE_STAGES.map(stage => {
                  const s = stageData[cp.id]?.[stage.key];
                  const isComplete = s?.status === "complete" || s?.override;
                  const isInProgress = s?.status === "in_progress";
                  const isBlocked = s?.status === "blocked";
                  return (
                    <div key={stage.key} style={{ width: 20, height: 6, background: isComplete ? C.safe : isInProgress ? C.cyan : isBlocked ? C.danger : "rgba(210,221,225,0.1)", borderRadius: 1 }} title={stage.label}/>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
