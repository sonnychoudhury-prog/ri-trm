import { useState, useEffect } from "react";
import { supabase, REVOLUTION_INTELL_WORKSPACE } from "./supabase";
import { C, GOOGLE_FONTS } from "./theme";
import Auth from "./Auth";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import CounterpartiesList from "./CounterpartiesList";
import CounterpartyDetail from "./CounterpartyDetail";
import Assessment from "./Assessment";
import Report from "./Report";
import WorkflowPage from "./WorkflowPage";
import CorrespondencePage from "./CorrespondencePage";
import CompanySettings from "./CompanySettings";
import Admin from "./Admin";
import AISecurityPage from "./AISecurityPage";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [view, setView] = useState("dashboard");
  const [counterparties, setCounterparties] = useState([]);
  const [activeCP, setActiveCP] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const [wsRes, settingsRes, cpRes] = await Promise.all([
          supabase.from("workspaces").select("*").eq("id", profileData.workspace_id).single(),
          supabase.from("company_settings").select("*").eq("workspace_id", profileData.workspace_id).single(),
          supabase.from("counterparties").select("*").eq("workspace_id", profileData.workspace_id).order("updated_at", { ascending: false })
        ]);
        if (wsRes.data) setWorkspace(wsRes.data);
        if (settingsRes.data) setCompanySettings(settingsRes.data);
        if (cpRes.data) setCounterparties(cpRes.data);
      }
    }
    setLoading(false);
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
    setView("counterparty-detail");
  }

  if (!session) return <Auth />;

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`${GOOGLE_FONTS}`}</style>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#109DCE", letterSpacing: "0.2em" }}>LOADING TRM...</div>
    </div>
  );

  if (!profile?.workspace_id) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}`}</style>
      <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 40, maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: "#19A8D5", letterSpacing: "0.12em", marginBottom: 8 }}>REVOLUTION INTELL</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.silverDim, letterSpacing: "0.15em", marginBottom: 24 }}>TRM // TRUST & RISK MANAGEMENT PLATFORM</div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 600, color: C.white, marginBottom: 12 }}>Account Pending Activation</div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, lineHeight: 1.6, marginBottom: 24 }}>Your account has been created but has not yet been assigned to a workspace. Please contact your administrator to complete your account setup.</div>
        <button style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" }} onClick={signOut}>SIGN OUT</button>
      </div>
    </div>
  );

  if (view === "assessment") return (
    <Assessment onComplete={saveAssessment} onCancel={() => setView(activeCP ? "counterparty-detail" : "counterparties")} />
  );

  if (view === "admin" && isSuperAdmin) return (
    <Admin session={session} profile={profile} onBack={() => setView("dashboard")} />
  );

  const layoutProps = {
    view, setView, profile, session, workspace, companySettings,
    counterparties, onSignOut: signOut, isSuperAdmin
  };

  return (
    <Layout {...layoutProps}>
      {view === "dashboard" && (
        <Dashboard
          counterparties={counterparties}
          profile={profile}
          companySettings={companySettings}
          workspace={workspace}
          setView={setView}
          setActiveCP={setActiveCP}
        />
      )}

      {view === "counterparties" && (
        <CounterpartiesList
          counterparties={counterparties}
          setView={setView}
          setActiveCP={setActiveCP}
          profile={profile}
        />
      )}

      {view === "counterparty-detail" && activeCP && (
        <CounterpartyDetail
          counterparty={activeCP}
          assessment={activeAssessment}
          session={session}
          profile={profile}
          setView={setView}
          onNewAssessment={() => setView("assessment")}
          onBack={() => setView("counterparties")}
        />
      )}

      {view === "workflow" && (
        <WorkflowPage
          counterparties={counterparties}
          setView={setView}
          setActiveCP={setActiveCP}
        />
      )}

      {view === "correspondence" && (
        <CorrespondencePage
          counterparties={counterparties}
          session={session}
          setView={setView}
          setActiveCP={setActiveCP}
        />
      )}

      {view === "settings" && (
        <CompanySettings
          userId={session.user.id}
          workspaceId={profile.workspace_id}
          onSave={(data) => {
            if (data) setCompanySettings(data);
            setView("dashboard");
          }}
        />
      )}

      {view === "ai-security" && (
        <AISecurityPage />
      )}

      {view === "documents" && (
        <div style={{ padding: "32px 36px" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// DOCUMENTS</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 24 }}>Generated Documents</div>
          <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>Documents Generated from Workflow</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>OPEN A COUNTERPARTY AND GO TO DEAL WORKFLOW TO GENERATE KYC, LOI, SPA AND OTHER DOCUMENTS</div>
            <button style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
              onClick={() => setView("counterparties")}>GO TO COUNTERPARTIES</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
