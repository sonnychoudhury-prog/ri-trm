import logo from "./assets/logo.png";
import { C, GOOGLE_FONTS } from "./theme";


const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "⬛" },
  { key: "counterparties", label: "Counterparties", icon: "◈" },
  { key: "workflow", label: "Deal Workflow", icon: "◎" },
  { key: "correspondence", label: "Correspondence", icon: "◇" },
  { key: "documents", label: "Documents", icon: "▣" },
  { key: "settings", label: "Settings", icon: "◉" },
  { key: "ai-security", label: "AI Security Scan", icon: "⬡" },
];

const ADMIN_ITEMS = [
  { key: "admin", label: "Super Admin", icon: "★" },
];

export default function Layout({ children, view, setView, profile, session, workspace, companySettings, counterparties, onSignOut, isSuperAdmin }) {
  const navBtn = (key) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 20px", cursor: "pointer", width: "100%", textAlign: "left",
    background: view === key ? "rgba(16,157,206,0.12)" : "transparent",
    border: "none",
    borderLeft: `3px solid ${view === key ? C.cyan : "transparent"}`,
    color: view === key ? C.cyan : C.silverDim,
    fontFamily: C.fontMono, fontSize: 13, letterSpacing: "0.12em",
    transition: "all 0.15s",
  });

  const activeDeals = counterparties?.filter(cp => cp.score).length || 0;
  const avgScore = counterparties?.length ? Math.round(counterparties.filter(cp => cp.score).reduce((a, b) => a + (b.score || 0), 0) / (counterparties.filter(cp => cp.score).length || 1)) : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(16,157,206,0.3)}button:hover{opacity:0.85}`}</style>

      {/* Sidebar */}
      <div style={{ width: 240, background: C.bg2, borderRight: `1px solid ${C.cyanBorder}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10, overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.cyanBorder}` }}>
          
          <img src={logo} alt="Revolution Intell" style={{ height: 90, objectFit: "contain", marginBottom: 14, maxWidth: "210px", display: "block" }} />
          {companySettings?.logo_url && (
            <img src={companySettings.logo_url} style={{ height: 32, objectFit: "contain", marginBottom: 10, maxWidth: "100%" }} alt="logo"/>
          )}
          <div style={{ fontFamily: C.fontDisplay, fontSize: 16, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.1em", lineHeight: 1.2 }}>
            {companySettings?.company_name || workspace?.name || "REVOLUTION INTELL"}
          </div>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.15em", marginTop: 4 }}>TRM PLATFORM v2.0</div>
        </div>

        {/* Stats */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.cyanBorder}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: C.bg, border: `1px solid ${C.cyanBorder}`, padding: "10px 12px" }}>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700, color: C.cyan }}>{counterparties?.length || 0}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.1em" }}>TOTAL</div>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.cyanBorder}`, padding: "10px 12px" }}>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700, color: avgScore >= 80 ? C.safe : avgScore >= 40 ? C.warn : C.danger }}>{avgScore || "—"}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.1em" }}>AVG SCORE</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.2em", padding: "8px 20px 4px", textTransform: "uppercase" }}>MAIN</div>
          {NAV_ITEMS.filter(item => {
            if (item.key === "settings" && profile?.role === "restricted") return false;
            return true;
          }).map(item => (
            <button key={item.key} style={navBtn(item.key)} onClick={() => setView(item.key)}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              <span>{item.key === "settings" ? "Settings" : item.label}</span>
            </button>
          ))}

          {isSuperAdmin && (
            <>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.silverDim, letterSpacing: "0.2em", padding: "16px 20px 4px", textTransform: "uppercase" }}>PLATFORM</div>
              {ADMIN_ITEMS.map(item => (
                <button key={item.key} style={navBtn(item.key)} onClick={() => setView(item.key)}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.cyanBorder}` }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.silverDim, letterSpacing: "0.08em", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 11, padding: "2px 8px", border: `1px solid ${profile?.role === "admin" ? C.cyan : C.silverDim}`, color: profile?.role === "admin" ? C.cyan : C.silverDim, letterSpacing: "0.1em" }}>{(profile?.role || "user").toUpperCase()}</span>
            <button style={{ padding: "2px 10px", background: "transparent", border: "1px solid rgba(224,82,82,0.4)", color: "rgba(224,82,82,0.7)", fontFamily: C.fontMono, fontSize: 14, letterSpacing: "0.1em", cursor: "pointer" }} onClick={onSignOut}>SIGN OUT</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}
