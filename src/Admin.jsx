import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C, GOOGLE_FONTS } from "./theme";

export default function Admin({ session, onBack }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteMsg, setInviteMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [u, c, co] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("counterparties").select("*, profiles(email, full_name, company)").order("updated_at", { ascending: false }),
      supabase.from("correspondence").select("*, profiles(email), counterparties(name)").order("created_at", { ascending: false })
    ]);
    if (u.data) setUsers(u.data);
    if (c.data) setCounterparties(c.data);
    if (co.data) setCorrespondence(co.data);
    setLoading(false);
  }

  async function updateRole(userId, role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) setError(error.message);
    else loadData();
  }

  async function deleteCorrespondence(id) {
    await supabase.from("correspondence").delete().eq("id", id);
    loadData();
  }

  async function deactivateUser(userId) {
    const { error } = await supabase.from("profiles").update({ role: "suspended" }).eq("id", userId);
    if (error) setError(error.message);
    else loadData();
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) { setInviteMsg("Please enter an email address."); return; }
    const { error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: Math.random().toString(36).slice(-10) + "Aa1!",
      options: { data: { invited_by: session.user.email, role: inviteRole } }
    });
    if (error) setInviteMsg("Error: " + error.message);
    else {
      setInviteMsg("Invite sent to " + inviteEmail);
      setInviteEmail("");
      setTimeout(() => setInviteMsg(""), 4000);
    }
  }

  function scoreColor(s) {
    if (!s) return C.silverDim;
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function roleColor(role) {
    if (role === "admin") return C.cyan;
    if (role === "suspended") return C.danger;
    return C.silverDim;
  }

  const tabBtn = (t) => ({
    padding: "10px 20px", background: tab === t ? "rgba(16,157,206,0.15)" : "transparent",
    border: `1px solid ${tab === t ? C.cyan : C.cyanBorder}`,
    color: tab === t ? C.cyan : C.silverDim,
    fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer"
  });

  const th = { fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 14px", borderBottom: `1px solid rgba(16,157,206,0.2)`, textAlign: "left", whiteSpace: "nowrap" };
  const td = { fontSize: 12, color: C.silver, padding: "12px 14px", borderBottom: `1px solid rgba(16,157,206,0.06)`, fontWeight: 300 };
  const inp = { background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: `1px solid ${C.cyanBorder}`, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em" }}>REVOLUTION INTELL</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginTop: 2 }}>TRM // ADMIN DASHBOARD</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>
              {users.length} USERS // {counterparties.length} COUNTERPARTIES
            </div>
            <button style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={onBack}>
              BACK TO TRM
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28 }}>
          <button style={tabBtn("users")} onClick={() => setTab("users")}>USER MANAGEMENT</button>
          <button style={tabBtn("counterparties")} onClick={() => setTab("counterparties")}>ALL COUNTERPARTIES</button>
          <button style={tabBtn("correspondence")} onClick={() => setTab("correspondence")}>ALL CORRESPONDENCE</button>
        </div>

        {error && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.danger, letterSpacing: "0.1em", marginBottom: 16 }}>{error}</div>}

        {tab === "users" && (
          <>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24, marginBottom: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// INVITE NEW USER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 160px", gap: 12, alignItems: "center" }}>
                <input style={{ ...inp, width: "100%" }} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@company.com"/>
                <select style={{ ...inp, width: "100%", appearance: "none" }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="restricted">Restricted</option>
                </select>
                <button style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", width: "100%" }} onClick={sendInvite}>
                  SEND INVITE
                </button>
              </div>
              {inviteMsg && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.safe, letterSpacing: "0.1em", marginTop: 10 }}>{inviteMsg}</div>}
            </div>

            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// REGISTERED USERS ({users.length})</div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(16,157,206,0.05)" }}>
                    <th style={th}>Email</th>
                    <th style={th}>Company</th>
                    <th style={th}>Role</th>
                    <th style={th}>Joined</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td style={{ ...td, textAlign: "center", padding: 24 }} colSpan={5}>Loading...</td></tr>}
                  {users.map(u => (
                    <tr key={u.id} style={{ background: u.role === "suspended" ? "rgba(224,82,82,0.04)" : "transparent" }}>
                      <td style={td}>{u.email}</td>
                      <td style={td}>{u.company || u.full_name || "—"}</td>
                      <td style={td}>
                        <span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "3px 10px", border: `1px solid ${roleColor(u.role)}`, color: roleColor(u.role), background: roleColor(u.role) + "22", letterSpacing: "0.1em" }}>
                          {(u.role || "user").toUpperCase()}
                        </span>
                      </td>
                      <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {u.role !== "admin" && u.email !== session?.user?.email && (
                            <button style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}
                              onClick={() => updateRole(u.id, "admin")}>MAKE ADMIN</button>
                          )}
                          {u.role === "admin" && u.email !== session?.user?.email && (
                            <button style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.silverDim, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}
                              onClick={() => updateRole(u.id, "user")}>MAKE USER</button>
                          )}
                          {u.role !== "restricted" && u.email !== session?.user?.email && (
                            <button style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.warn, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}
                              onClick={() => updateRole(u.id, "restricted")}>RESTRICT</button>
                          )}
                          {u.role !== "suspended" && u.email !== session?.user?.email && (
                            <button style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}
                              onClick={() => deactivateUser(u.id)}>SUSPEND</button>
                          )}
                          {u.role === "suspended" && (
                            <button style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${C.safe}`, color: C.safe, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}
                              onClick={() => updateRole(u.id, "user")}>REINSTATE</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 24, background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 12 }}>// ROLE PERMISSIONS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                {[
                  { role: "ADMIN", color: C.cyan, perms: ["Full platform access", "All user management", "All counterparty data", "System configuration"] },
                  { role: "USER", color: C.safe, perms: ["Own counterparties only", "Full assessment access", "Document generation", "Correspondence log"] },
                  { role: "RESTRICTED", color: C.warn, perms: ["Own counterparties only", "View only access", "No document generation", "No correspondence"] },
                  { role: "SUSPENDED", color: C.danger, perms: ["No platform access", "Login blocked", "Data preserved", "Reinstate anytime"] },
                ].map(r => (
                  <div key={r.role} style={{ background: C.bg, border: `1px solid ${r.color}33`, padding: 16 }}>
                    <div style={{ fontFamily: C.fontMono, fontSize: 10, color: r.color, letterSpacing: "0.15em", marginBottom: 10 }}>{r.role}</div>
                    {r.perms.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.silverDim, fontWeight: 300, marginBottom: 5, lineHeight: 1.4 }}>&#8226; {p}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "counterparties" && (
          <>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// ALL COUNTERPARTIES ({counterparties.length})</div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "rgba(16,157,206,0.05)" }}>
                    <th style={th}>Counterparty</th>
                    <th style={th}>Country</th>
                    <th style={th}>Transaction</th>
                    <th style={th}>Value</th>
                    <th style={th}>Score</th>
                    <th style={th}>User</th>
                    <th style={th}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td style={{ ...td, textAlign: "center", padding: 24 }} colSpan={7}>Loading...</td></tr>}
                  {counterparties.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: 500, color: C.white }}>{c.name}</td>
                      <td style={td}>{c.country || "—"}</td>
                      <td style={td}>{c.tx_type || "—"}</td>
                      <td style={td}>{c.tx_value || "—"}</td>
                      <td style={td}>
                        {c.score ? (
                          <span style={{ fontFamily: C.fontMono, fontSize: 10, padding: "3px 10px", border: `1px solid ${scoreColor(c.score)}`, color: scoreColor(c.score), background: scoreColor(c.score) + "22" }}>
                            {c.score}/100
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ ...td, fontSize: 11 }}>{c.profiles?.email || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{new Date(c.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "correspondence" && (
          <>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// ALL CORRESPONDENCE ({correspondence.length})</div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "rgba(16,157,206,0.05)" }}>
                    <th style={th}>Counterparty</th>
                    <th style={th}>Source</th>
                    <th style={th}>User</th>
                    <th style={th}>Date</th>
                    <th style={th}>AI Analysis</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td style={{ ...td, textAlign: "center", padding: 24 }} colSpan={5}>Loading...</td></tr>}
                  {correspondence.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: 500, color: C.white }}>{c.counterparties?.name || "—"}</td>
                      <td style={td}>{c.source || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{c.profiles?.email || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 300 }}>{c.ai_analysis ? c.ai_analysis.substring(0, 100) + "..." : "—"}</td>
                      <td style={td}><button onClick={() => deleteCorrespondence(c.id)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid rgba(224,82,82,0.3)", color: "#E05252", fontFamily: "monospace", fontSize: 9, cursor: "pointer" }}>DELETE</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
