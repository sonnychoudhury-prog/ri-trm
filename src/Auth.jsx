import { useState } from "react";
import { supabase } from "./supabase";
import { C, GOOGLE_FONTS } from "./theme";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignup() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, company } } });
    if (error) setError(error.message);
    else setMessage("Account created. You can now sign in.");
    setLoading(false);
  }

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box", marginBottom: 14 };
  const lbl = { display: "block", fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}`}</style>
      <div style={{ width: "100%", maxWidth: 440, background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 40 }}>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em", marginBottom: 4 }}>REVOLUTION INTELL</div>
        <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginBottom: 32 }}>TRM // TRUST & RISK MANAGEMENT PLATFORM</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 26, fontWeight: 700, color: C.white, marginBottom: 24 }}>{mode === "login" ? "Sign In" : "Request Access"}</div>
        {error && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.danger, letterSpacing: "0.1em", marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.safe, letterSpacing: "0.1em", marginBottom: 12 }}>{message}</div>}
        {mode === "signup" && <>
          <label style={lbl}>Full Name</label>
          <input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"/>
          <label style={lbl}>Company</label>
          <input style={inp} value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name"/>
        </>}
        <label style={lbl}>Email</label>
        <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"/>
        <label style={lbl}>Password</label>
        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
        <button style={{ width: "100%", padding: 14, background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginTop: 8 }}
          onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}>
          {loading ? "PROCESSING..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
        <hr style={{ border: "none", borderTop: `1px solid ${C.cyanBorder}`, margin: "24px 0" }}/>
        <button style={{ background: "none", border: "none", color: C.cyan, fontFamily: C.fontMono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em", display: "block", textAlign: "center", width: "100%" }}
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
          {mode === "login" ? "NEED ACCESS? REQUEST AN ACCOUNT" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
        </button>
      </div>
    </div>
  );
}
