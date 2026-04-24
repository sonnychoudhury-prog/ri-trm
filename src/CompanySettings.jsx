import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const CYAN_BRIGHT = "#19A8D5";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const DANGER = "#E05252";

const COMMODITY_OPTIONS = ["Gold", "Copper", "Cobalt", "Silver", "Platinum", "Critical Minerals", "Oil", "Natural Gas", "Other"];

export default function CompanySettings({ userId, workspaceId, onSave }) {
  const [settings, setSettings] = useState({
    company_name: "", company_address: "", company_registration: "",
    company_country: "", signatory_name: "", signatory_title: "",
    signatory_email: "", phone: "", website: "", logo_url: "",
    primary_commodities: []
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadSettings(); }, [userId]);

  async function loadSettings() {
    const { data } = await supabase.from("company_settings").select("*").eq("workspace_id", workspaceId).single();
    if (data) {
      setSettings(data);
      if (data.logo_url) setLogoPreview(data.logo_url);
    }
  }

  function setField(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  function toggleCommodity(c) {
    const current = settings.primary_commodities || [];
    if (current.includes(c)) setField("primary_commodities", current.filter(x => x !== c));
    else setField("primary_commodities", [...current, c]);
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo() {
    if (!logoFile) return settings.logo_url;
    const ext = logoFile.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, logoFile, { upsert: true });
    if (error) throw new Error("Logo upload failed: " + error.message);
    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const logoUrl = await uploadLogo();
      const payload = { ...settings, user_id: userId, logo_url: logoUrl, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("company_settings").upsert(payload, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
      setMessage("Company settings saved successfully.");
      if (onSave) onSave(payload);
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  return (
    <div style={{ background: "#090C11", minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: "#D2DDE1" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: "1px solid rgba(16,157,206,0.25)", marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: "#19A8D5", letterSpacing: "0.12em" }}>REVOLUTION INTELL</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#8A9BA3", letterSpacing: "0.2em", marginTop: 2 }}>TRM // COMPANY SETTINGS</div>
          </div>
          <button style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(16,157,206,0.3)", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={() => onSave && onSave(null)}>BACK TO TRM</button>
        </div>

        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 16, marginTop: 8 }}>// COMPANY BRANDING</div>

        <div style={{ background: "#0D1219", border: "1px solid rgba(16,157,206,0.22)", padding: 20, display: "flex", alignItems: "center", gap: 20, marginBottom: 8 }}>
          {logoPreview
            ? <img src={logoPreview} style={{ width: 80, height: 80, objectFit: "contain", background: "#fff", padding: 4 }} alt="Logo"/>
            : <div style={{ width: 80, height: 80, background: "rgba(16,157,206,0.05)", border: "1px dashed rgba(16,157,206,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#8A9BA3", textAlign: "center" }}>NO LOGO</span>
              </div>
          }
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#8A9BA3", letterSpacing: "0.1em", marginBottom: 10 }}>Upload your company logo. PNG or SVG recommended.</div>
            <input type="file" accept="image/*" style={{ display: "none" }} id="logo-upload" onChange={handleLogoChange}/>
            <label htmlFor="logo-upload" style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(16,157,206,0.3)", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}>CHOOSE FILE</label>
            {logoFile && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SAFE, marginTop: 8, letterSpacing: "0.1em" }}>{logoFile.name}</div>}
          </div>
        </div>

        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12, marginTop: 28 }}>// COMPANY INFORMATION</div>

        <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Company Name</label>
        <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box", marginBottom: 14 }} value={settings.company_name} onChange={e => setField("company_name", e.target.value)} placeholder="e.g. Muanda Global LLC"/>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Country</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.company_country} onChange={e => setField("company_country", e.target.value)} placeholder="e.g. DRC"/>
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Registration Number</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.company_registration} onChange={e => setField("company_registration", e.target.value)} placeholder="Registration or tax ID"/>
          </div>
        </div>

        <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Company Address</label>
        <textarea style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "11px 14px", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300, marginBottom: 14 }} value={settings.company_address} onChange={e => setField("company_address", e.target.value)} placeholder="Full registered address"/>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Phone</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.phone} onChange={e => setField("phone", e.target.value)} placeholder="+1 (000) 000 0000"/>
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Website</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.website} onChange={e => setField("website", e.target.value)} placeholder="www.company.com"/>
          </div>
        </div>

        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12, marginTop: 28 }}>// AUTHORIZED SIGNATORY</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Signatory Full Name</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.signatory_name} onChange={e => setField("signatory_name", e.target.value)} placeholder="e.g. Patrick Lendo"/>
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Title</label>
            <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" }} value={settings.signatory_title} onChange={e => setField("signatory_title", e.target.value)} placeholder="e.g. Managing Director"/>
          </div>
        </div>

        <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 }}>Signatory Email</label>
        <input style={{ width: "100%", background: "#0D1219", border: "1px solid rgba(16,157,206,0.25)", color: "#D2DDE1", fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box", marginBottom: 28 }} value={settings.signatory_email} onChange={e => setField("signatory_email", e.target.value)} placeholder="signatory@company.com"/>

        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12 }}>// PRIMARY COMMODITIES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {COMMODITY_OPTIONS.map(c => (
            <button key={c} onClick={() => toggleCommodity(c)} style={{ padding: "6px 14px", background: (settings.primary_commodities || []).includes(c) ? "rgba(16,157,206,0.15)" : "transparent", border: "1px solid " + ((settings.primary_commodities || []).includes(c) ? CYAN : "rgba(210,221,225,0.15)"), color: (settings.primary_commodities || []).includes(c) ? CYAN : "#8A9BA3", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.1em", cursor: "pointer" }}>{c}</button>
          ))}
        </div>

        {error && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: DANGER, letterSpacing: "0.1em", marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.1em", marginBottom: 12, textAlign: "center" }}>{message}</div>}

        <button style={{ width: "100%", padding: 16, background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }} onClick={save} disabled={saving}>
          {saving ? "SAVING..." : "SAVE COMPANY SETTINGS"}
        </button>
      </div>
    </div>
  );
}
