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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editCP, setEditCP] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  async function deleteUser(userId) {
    await supabase.from("profiles").update({ role: "suspended" }).eq("id", userId);
    setConfirmDelete(null);
    loadData();
  }

  async function deleteCounterparty(id) {
    await supabase.from("deal_stages").delete().eq("counterparty_id", id);
    await supabase.from("correspondence").delete().eq("counterparty_id", id);
    await supabase.from("assessments").delete().eq("counterparty_id", id);
    await supabase.from("counterparties").delete().eq("id", id);
    setConfirmDelete(null);
    loadData();
  }

  async function deleteCorrespondence(id) {
    await supabase.from("correspondence").delete().eq("id", id);
    setConfirmDelete(null);
    loadData();
  }

  async function saveEditCP() {
    await supabase.from("counterparties").update({
      name: editForm.name,
      country: editForm.country,
      tx_type: editForm.tx_type,
      tx_value: editForm.tx_value,
      updated_at: new Date().toISOString()
    }).eq("id", editCP.id);
    setEditCP(null);
    loadData();
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) { setInviteMsg("Please enter an email address."); return; }
    const { error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: Math.random().toString(36).slice(-10) + "Aa1!",
      options: { data: { invited_by: session.user.email, role: inviteRole } }
    });
    if (error) setInviteMsg("Error: " + error.message);
    else { setInviteMsg("Invite sent to " + inviteEmail); setInviteEmail(""); setTimeout(() => setInviteMsg(""), 4000); }
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
    if (role === "restricted") return C.warn;
    return C.silverDim;
  }

  const tabBtn = (t) => ({
    padding: "10px 20px", background: tab === t ? "rgba(16,157,206,0.15)" : "transparent",
    border: `1px solid ${tab === t ? C.cyan : C.cyanBorder}`,
    color: tab === t ? C.cyan : C.silverDim,
    fontFamily: C.fontMono, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer"
  });

  const th = { fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 14px", borderBottom: `1px solid rgba(16,157,206,0.2)`, textAlign: "left", whiteSpace: "nowrap" };
  const td = { fontSize: 12, color: C.silver, padding: "10px 14px", borderBottom: `1px solid rgba(16,157,206,0.06)`, fontWeight: 300, verticalAlign: "middle" };
  const inp = { background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box" };
  const actionBtn = (col) => ({ padding: "3px 10px", background: "transparent", border: `1px solid ${col || C.cyanBorder}`, color: col || C.cyan, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer", marginRight: 4 });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.font, color: C.silver }}>
      <style>{`${GOOGLE_FONTS}*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}select option{background:#0D1219}`}</style>

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.danger}`, padding: 32, maxWidth: 400, width: "90%" }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 12 }}>Confirm Delete</div>
            <div style={{ fontSize: 13, color: C.silverDim, marginBottom: 24, lineHeight: 1.6 }}>{confirmDelete.message}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...actionBtn(C.danger), padding: "10px 20px", fontSize: 11 }} onClick={confirmDelete.action}>DELETE</button>
              <button style={{ ...actionBtn(), padding: "10px 20px", fontSize: 11 }} onClick={() => setConfirmDelete(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {editCP && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 32, maxWidth: 500, width: "90%" }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 20 }}>Edit Counterparty</div>
            {[["Name", "name"], ["Country", "country"], ["Transaction Type", "tx_type"], ["Value", "tx_value"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.cyan, letterSpacing: "0.15em", marginBottom: 6 }}>{label.toUpperCase()}</div>
                <input style={{ ...inp, width: "100%" }} value={editForm[key] || ""} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ ...actionBtn(C.cyan), padding: "10px 20px", fontSize: 11 }} onClick={saveEditCP}>SAVE</button>
              <button style={{ ...actionBtn(), padding: "10px 20px", fontSize: 11 }} onClick={() => setEditCP(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: `1px solid ${C.cyanBorder}`, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.cyanBright, letterSpacing: "0.12em" }}>REVOLUTION INTELL</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.2em", marginTop: 2 }}>TRM // ADMIN DASHBOARD</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>{users.length} USERS // {counterparties.length} COUNTERPARTIES // {correspondence.length} LOGS</div>
            <button style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${C.cyanBorder}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }} onClick={onBack}>BACK TO TRM</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28, flexWrap: "wrap" }}>
          <button style={tabBtn("users")} onClick={() => setTab("users")}>USER MANAGEMENT</button>
          <button style={tabBtn("counterparties")} onClick={() => setTab("counterparties")}>ALL COUNTERPARTIES</button>
          <button style={tabBtn("correspondence")} onClick={() => setTab("correspondence")}>ALL CORRESPONDENCE</button>
        </div>

        {error && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.danger, letterSpacing: "0.1em", marginBottom: 16, padding: "10px 14px", background: "rgba(224,82,82,0.08)", border: `1px solid rgba(224,82,82,0.2)` }}>{error}</div>}

        {tab === "users" && (
          <>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 24, marginBottom: 24 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// INVITE NEW USER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 140px", gap: 12, alignItems: "center" }}>
                <input style={{ ...inp, width: "100%" }} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@company.com"/>
                <select style={{ ...inp, width: "100%", appearance: "none" }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="restricted">Restricted</option>
                </select>
                <button style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", width: "100%" }} onClick={sendInvite}>SEND INVITE</button>
              </div>
              {inviteMsg && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.safe, letterSpacing: "0.1em", marginTop: 10 }}>{inviteMsg}</div>}
            </div>

            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 16 }}>// REGISTERED USERS ({users.length})</div>
            <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
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
                      <td style={td}><span style={{ fontFamily: C.fontMono, fontSize: 9, padding: "3px 10px", border: `1px solid ${roleColor(u.role)}`, color: roleColor(u.role), background: roleColor(u.role) + "22", letterSpacing: "0.1em" }}>{(u.role || "user").toUpperCase()}</span></td>
                      <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={td}>
                        {u.email !== session?.user?.email && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {u.role !== "admin" && <button style={actionBtn(C.cyan)} onClick={() => updateRole(u.id, "admin")}>ADMIN</button>}
                            {u.role === "admin" && <button style={actionBtn()} onClick={() => updateRole(u.id, "user")}>DEMOTE</button>}
                            {u.role !== "restricted" && <button style={actionBtn(C.warn)} onClick={() => updateRole(u.id, "restricted")}>RESTRICT</button>}
                            {u.role !== "suspended" && <button style={actionBtn(C.danger)} onClick={() => setConfirmDelete({ message: `Suspend user ${u.email}? They will lose platform access.`, action: () => deleteUser(u.id) })}>SUSPEND</button>}
                            {u.role === "suspended" && <button style={actionBtn(C.safe)} onClick={() => updateRole(u.id, "user")}>REINSTATE</button>}
                          </div>
                        )}
                        {u.email === session?.user?.email && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>CURRENT USER</span>}
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
                  { role: "ADMIN", color: C.cyan, perms: ["Full platform access", "All user management", "All counterparty data", "Delete and edit anything"] },
                  { role: "USER", color: C.safe, perms: ["Own counterparties only", "Full assessment access", "Document generation", "Correspondence log"] },
                  { role: "RESTRICTED", color: C.warn, perms: ["Own counterparties only", "View only access", "No document generation", "No correspondence"] },
                  { role: "SUSPENDED", color: C.danger, perms: ["No platform access", "Login blocked", "Data preserved", "Reinstate anytime"] },
                ].map(r => (
                  <div key={r.role} style={{ background: C.bg, border: `1px solid ${r.color}33`, padding: 16 }}>
                    <div style={{ fontFamily: C.fontMono, fontSize: 10, color: r.color, letterSpacing: "0.15em", marginBottom: 10 }}>{r.role}</div>
                    {r.perms.map((p, i) => <div key={i} style={{ fontSize: 11, color: C.silverDim, fontWeight: 300, marginBottom: 5, lineHeight: 1.4 }}>&#8226; {p}</div>)}
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr style={{ background: "rgba(16,157,206,0.05)" }}>
                    <th style={th}>Name</th>
                    <th style={th}>Country</th>
                    <th style={th}>Transaction</th>
                    <th style={th}>Value</th>
                    <th style={th}>Score</th>
                    <th style={th}>User</th>
                    <th style={th}>Updated</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td style={{ ...td, textAlign: "center", padding: 24 }} colSpan={8}>Loading...</td></tr>}
                  {counterparties.map(cp => (
                    <tr key={cp.id}>
                      <td style={{ ...td, fontWeight: 500, color: C.white }}>{cp.name}</td>
                      <td style={td}>{cp.country || "—"}</td>
                      <td style={td}>{cp.tx_type || "—"}</td>
                      <td style={td}>{cp.tx_value || "—"}</td>
                      <td style={td}>{cp.score ? <span style={{ fontFamily: C.fontMono, fontSize: 10, padding: "3px 10px", border: `1px solid ${scoreColor(cp.score)}`, color: scoreColor(cp.score), background: scoreColor(cp.score) + "22" }}>{cp.score}/100</span> : "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{cp.profiles?.email || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{new Date(cp.updated_at).toLocaleDateString()}</td>
                      <td style={td}>
                        <button style={actionBtn(C.cyan)} onClick={() => { setEditCP(cp); setEditForm({ name: cp.name, country: cp.country || "", tx_type: cp.tx_type || "", tx_value: cp.tx_value || "" }); }}>EDIT</button>
                        <button style={actionBtn(C.danger)} onClick={() => setConfirmDelete({ message: `Delete counterparty "${cp.name}"? This will permanently delete all assessments, correspondence, and workflow data for this counterparty.`, action: () => deleteCounterparty(cp.id) })}>DELETE</button>
                      </td>
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
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
                  {loading && <tr><td style={{ ...td, textAlign: "center", padding: 24 }} colSpan={6}>Loading...</td></tr>}
                  {correspondence.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: 500, color: C.white }}>{c.counterparties?.name || "—"}</td>
                      <td style={td}>{c.source || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{c.profiles?.email || "—"}</td>
                      <td style={{ ...td, fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 280 }}>{c.ai_analysis ? c.ai_analysis.substring(0, 80) + "..." : "—"}</td>
                      <td style={td}>
                        <button style={actionBtn(C.danger)} onClick={() => setConfirmDelete({ message: `Delete this correspondence entry from ${c.counterparties?.name || "unknown"}? This cannot be undone.`, action: () => deleteCorrespondence(c.id) })}>DELETE</button>
                      </td>
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
