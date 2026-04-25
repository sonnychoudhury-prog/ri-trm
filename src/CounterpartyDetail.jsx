import { useState } from "react";
import { C } from "./theme";
import Report from "./Report";
import Workflow from "./Workflow";
import Correspondence from "./Correspondence";
import Notes from "./Notes";

export default function CounterpartyDetail({ counterparty, assessment, session, profile, setView, onNewAssessment, onBack }) {
  const [tab, setTab] = useState("report");

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{
      padding: "10px 20px",
      background: tab === t ? "rgba(16,157,206,0.15)" : "transparent",
      border: "none",
      borderBottom: `2px solid ${tab === t ? C.cyan : "transparent"}`,
      color: tab === t ? C.cyan : C.silverDim,
      fontFamily: C.fontMono, fontSize: 13, letterSpacing: "0.15em",
      cursor: "pointer", whiteSpace: "nowrap"
    }}>{label}</button>
  );

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: C.fontMono, fontSize: 12, color: C.silverDim, letterSpacing: "0.1em" }}>
        <span style={{ cursor: "pointer", color: C.cyan }} onClick={() => setView("dashboard")}>DASHBOARD</span>
        <span>&#8250;</span>
        <span style={{ cursor: "pointer", color: C.cyan }} onClick={() => setView("counterparties")}>COUNTERPARTIES</span>
        <span>&#8250;</span>
        <span>{counterparty.name}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.cyanBorder}` }}>
        <div>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 30, fontWeight: 700, color: C.white, marginBottom: 6 }}>{counterparty.name}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {counterparty.country && <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim }}>&#127758; {counterparty.country}</span>}
            {counterparty.tx_type && <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim }}>&#9670; {counterparty.tx_type}</span>}
            {counterparty.tx_value && <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim }}>&#36; {counterparty.tx_value}</span>}
            <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim }}>Updated {new Date(counterparty.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {counterparty.score && (
            <div style={{ textAlign: "center", background: C.bg2, border: `1px solid ${scoreColor(counterparty.score)}44`, padding: "12px 20px" }}>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 48, fontWeight: 700, color: scoreColor(counterparty.score), lineHeight: 1 }}>{counterparty.score}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.1em", marginTop: 4 }}>TRUST SCORE</div>
            </div>
          )}
          {profile?.role !== "restricted" && (
            <button style={{ padding: "10px 20px", background: "rgba(16,157,206,0.08)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer" }}
              onClick={onNewAssessment}>
              + NEW ASSESSMENT
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${C.cyanBorder}`, overflowX: "auto" }}>
        {tabBtn("report", "TRUST REPORT")}
        {profile?.role !== "restricted" && tabBtn("workflow", "DEAL WORKFLOW")}
        {profile?.role !== "restricted" && tabBtn("correspondence", "CORRESPONDENCE")}
        {profile?.role !== "restricted" && tabBtn("documents", "DOCUMENTS")}
      </div>

      {tab === "report" && (
        assessment ? (
          <Report assessment={assessment} onBack={onBack} onNewAssessment={onNewAssessment} />
        ) : (
          <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>No Assessment on File</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>RUN A TRUST ASSESSMENT TO GENERATE THE FULL RISK REPORT FOR {counterparty.name.toUpperCase()}</div>
            {profile?.role !== "restricted" && (
              <button style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
                onClick={onNewAssessment}>RUN ASSESSMENT</button>
            )}
          </div>
        )
      )}

      {tab === "workflow" && (
        <Workflow counterpartyId={counterparty.id} counterpartyName={counterparty.name} userId={session.user.id} counterparty={counterparty} />
      )}

      {tab === "correspondence" && (
        <Correspondence counterpartyId={counterparty.id} counterpartyName={counterparty.name} userId={session.user.id} />
      )}

      {tab === "notes" && (
        <Notes counterpartyId={counterparty.id} workspaceId={counterparty.workspace_id} userId={session.user.id} profile={profile} />
      )}

      {tab === "documents" && (
        <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// GENERATED DOCUMENTS</div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "40px 0" }}>
            DOCUMENTS ARE GENERATED FROM THE DEAL WORKFLOW PIPELINE.<br/>
            <span style={{ cursor: "pointer", color: C.cyan, marginTop: 8, display: "inline-block" }} onClick={() => setTab("workflow")}>GO TO WORKFLOW &#8594;</span>
          </div>
        </div>
      )}
    </div>
  );
}
