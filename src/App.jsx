import { useState, useEffect } from "react";
import { supabase, REVOLUTION_INTELL_WORKSPACE } from "./supabase";
import { C, GOOGLE_FONTS } from "./theme";
import Auth from "./Auth";
import Assessment from "./Assessment";
import Report from "./Report";
import Workflow from "./Workflow";
import Correspondence from "./Correspondence";
import CompanySettings from "./CompanySettings";
import Admin from "./Admin";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [view, setView] = useState("list");
  const [counterparties, setCounterparties] = useState([]);
  const [activeCP, setActiveCP] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cpView, setCpView] = useState("report");

  const isSuperAdmin = profile?.role === "admin" && profile?.workspace_id === REVOLUTION_INTELL_WORKSPACE;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else { setProfile(null); setWorkspace(null); setLoading(false); }
    });
  }, []);

  async function loadUserData(userId) {
    setLoading(true);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (profileData) {
      setProfile(profileData);
      if (profileData.workspace_id) {
        const { data: wsData } = await supabase.from("workspaces").select("*").eq("id", profileData.workspace_id).single();
        if (wsData) setWorkspace(wsData);
        const { data: settingsData } = await supabase.from("company_settings").select("*").eq("workspace_id", profileData.workspace_id).single();
        if (settingsData) setCompanySettings(settingsData);
        loadCounterparties(profileData.workspace_id, profileData.role);
      }
    }
    setLoading(false);
  }

  async function loadCounterparties(workspaceId, role) {
    let query = supabase.from("counterparties").select("*").order("updated_at", { ascending: false });
    if (role === "admin" || role === "user" || role === "restricted") {
      query = query.eq("workspace_id", workspaceId);
    }
    const { data } = await query;
    if (data) setCounterparties(data);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setWorkspace(null); setCounterparties([]);
  }

  async function saveAssessment(assessmentData) {
    const { entity, result } = assessmentData;
    const { data: cpData } = await supabase.from("counterparties").upsert({
      user_id: session.user.id,
      workspace_id: profile.workspace_id,
      name: entity.name, country: entity.country,
      tx_type: entity.txType, tx_value: entity.txValue,
      rel_source: entity.relSource, ratings: result.dimension_scores,
      score: result.composite_score, updated_at: new Date().toISOString()
    }).select().single();

    if (cpData) {
      await supabase.from("assessments").insert({
        counterparty_id: cpData.id, user_id: session.user.id,
        workspace_id: profile.workspace_id,
        score: result.composite_score, ratings: result.dimension_scores,
        strategic_assessment: result.strategic_assessment,
        flags: result.flags, recommendation: result.recommendation_detail
      });
      setActiveCP(cpData);
      setActiveAssessment(assessmentData);
      setCounterparties(prev => {
        const exists = prev.find(c => c.id === cpData.id);
        if (exists) return prev.map(c => c.id === cpData.id ? cpData : c);
        return [cpData, ...prev];
      });
    }
    setView("detail");
    setCpView("report");
  }

  function openCP(cp) {
    setActiveCP(cp);
    setActiveAssessment(null);
    setView("detail");
    setCpView("report");
  }

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  if (!session) return <Auth />;

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.cyan, letterSpacing: "0.2em" }}>LOADING TRM...</div>
    </div>
  );

  if (!profile?.workspace_id && !isSuperAdmin) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}`}</style>
      <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 40, maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em", marginBottom: 8 }}>REVOLUTION INTELL</div>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 24 }}>TRM // TRUST & RISK MANAGEMENT PLATFORM</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 600, color: C.white, marginBottom: 12 }}>Account Pending Activation</div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, lineHeight: 1.6, marginBottom: 24 }}>Your account has been created but has not yet been assigned to a workspace. Please contact your administrator to complete your account setup.</div>
        <button style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" }} onClick={signOut}>SIGN OUT</button>
      </div>
    </div>
  );

  if (view === "assessment") return <Assessment onComplete={saveAssessment} onCancel={() => setView("list")} />;
  if (view === "settings") return <CompanySettings userId={session.user.id} workspaceId={profile.workspace_id} onSave={(data) => { if (data) setCompanySettings(data); setView("list"); }} />;
  if (view === "admin" && isSuperAdmin) return <Admin session={session} profile={profile} onBack={() => setView("list")} />;

  const hdrBtn = (col) => ({ padding: "7px 14px", background: "transparent", border: `1px solid ${col || C.cyanBorder}`, color: col || C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.12em", cursor: "pointer" });

  const Header = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: `1px solid ${C.cyanBorder}`, marginBottom: 36 }}>
      <div style={{ cursor: "pointer" }} onClick={() => setView("list")}>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em" }}>
          {companySettings?.company_name || workspace?.name || "REVOLUTION INTELL"}
        </div>
        <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginTop: 2 }}>TRM // TRUST & RISK MANAGEMENT PLATFORM v2.0</div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>{session.user.email}</span>
        {isSuperAdmin && <button style={hdrBtn(C.cyan)} onClick={() => setView("admin")}>SUPER ADMIN</button>}
        {(profile?.role === "admin" || profile?.role === "user") && <button style={hdrBtn()} onClick={() => setView("settings")}>SETTINGS</button>}
        <button style={hdrBtn("rgba(224,82,82,0.6)")} onClick={signOut}>SIGN OUT</button>
      </div>
    </div>
  );

  if (view === "detail" && activeCP) {
    const tabBtn = (t) => ({
      padding: "10px 20px", background: cpView === t ? "rgba(16,157,206,0.15)" : "transparent",
      border: `1px solid ${cpView === t ? C.cyan : C.cyanBorder}`,
      color: cpView === t ? C.cyan : C.silverDim,
      fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer"
    });

    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
        <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px 80px" }}>
          <Header />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 6, cursor: "pointer" }} onClick={() => setView("list")}>&#8592; ALL COUNTERPARTIES</div>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>{activeCP.name}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, marginTop: 4 }}>{[activeCP.country, activeCP.tx_type, activeCP.tx_value].filter(Boolean).join(" // ")}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {activeCP.score && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: C.fontDisplay, fontSize: 42, fontWeight: 700, color: scoreColor(activeCP.score), lineHeight: 1 }}>{activeCP.score}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.1em" }}>TRUST SCORE</div>
                </div>
              )}
              {profile?.role !== "restricted" && (
                <button style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={() => setView("assessment")}>
                  NEW ASSESSMENT
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, marginBottom: 28 }}>
            <button style={tabBtn("report")} onClick={() => setCpView("report")}>TRUST REPORT</button>
            {profile?.role !== "restricted" && <button style={tabBtn("workflow")} onClick={() => setCpView("workflow")}>DEAL WORKFLOW</button>}
            {profile?.role !== "restricted" && <button style={tabBtn("correspondence")} onClick={() => setCpView("correspondence")}>CORRESPONDENCE</button>}
          </div>

          {cpView === "report" && (
            activeAssessment ? (
              <Report assessment={activeAssessment} onBack={() => setView("list")} onNewAssessment={() => setView("assessment")} />
            ) : (
              <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
                <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>No Assessment Yet</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>RUN A TRUST ASSESSMENT TO GENERATE THE FULL RISK REPORT</div>
                {profile?.role !== "restricted" && (
                  <button style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => setView("assessment")}>
                    RUN ASSESSMENT
                  </button>
                )}
              </div>
            )
          )}

          {cpView === "workflow" && <Workflow counterpartyId={activeCP.id} counterpartyName={activeCP.name} userId={session.user.id} counterparty={activeCP} />}
          {cpView === "correspondence" && <Correspondence counterpartyId={activeCP.id} counterpartyName={activeCP.name} userId={session.user.id} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px 80px" }}>
        <Header />
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// COUNTERPARTY INTELLIGENCE</div>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 30, fontWeight: 700, color: C.white }}>
                {companySettings?.company_name || workspace?.name || "Your"} Counterparties
              </div>
              <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 6 }}>
                {counterparties.length} counterpart{counterparties.length !== 1 ? "ies" : "y"} on file
              </div>
            </div>
            {profile?.role !== "restricted" && (
              <button style={{ padding: "12px 28px", background: "rgba(16,157,206,0.08)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => setView("assessment")}>
                + NEW ASSESSMENT
              </button>
            )}
          </div>

          {counterparties.length === 0 && (
            <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 600, color: C.white, marginBottom: 8 }}>No Counterparties Yet</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>START YOUR FIRST TRUST ASSESSMENT TO BUILD YOUR COUNTERPARTY INTELLIGENCE FILE</div>
              {profile?.role !== "restricted" && (
                <button style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => setView("assessment")}>
                  START FIRST ASSESSMENT
                </button>
              )}
            </div>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {counterparties.map(cp => (
              <div key={cp.id} style={{ background: C.bg2, border: `1px solid ${cp.score ? scoreColor(cp.score) + "44" : C.cyanBorder}`, borderLeft: `3px solid ${cp.score ? scoreColor(cp.score) : C.cyanBorder}`, padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => openCP(cp)}>
                <div>
                  <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 600, color: C.white, marginBottom: 4 }}>{cp.name}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.1em" }}>{[cp.country, cp.tx_type, cp.tx_value].filter(Boolean).join(" // ")}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em", marginTop: 4 }}>Last updated: {new Date(cp.updated_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
                  {cp.score && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: C.fontDisplay, fontSize: 36, fontWeight: 700, color: scoreColor(cp.score), lineHeight: 1 }}>{cp.score}</div>
                      <div style={{ fontFamily: C.fontMono, fontSize: 8, color: C.silverDim, letterSpacing: "0.1em" }}>TRUST SCORE</div>
                    </div>
                  )}
                  <span style={{ color: C.silverDim }}>&#9654;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
