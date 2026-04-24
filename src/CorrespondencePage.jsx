import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C } from "./theme";

export default function CorrespondencePage({ counterparties, session, setView, setActiveCP }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCP, setFilterCP] = useState("all");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data } = await supabase
      .from("correspondence")
      .select("*, counterparties(name, id)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setLogs(data);
    setLoading(false);
  }

  async function deleteLog(id) {
    await supabase.from("correspondence").delete().eq("id", id);
    setLogs(logs.filter(l => l.id !== id));
  }

  function flagColor(level) {
    if (level === "red") return C.danger;
    if (level === "yellow") return C.warn;
    return C.safe;
  }

  function flagLabel(level) {
    if (level === "red") return "RISK";
    if (level === "yellow") return "CAUTION";
    return "CLEAR";
  }

  const filtered = logs.filter(log => {
    if (filterCP !== "all" && log.counterparty_id !== filterCP) return false;
    if (search && !log.content?.toLowerCase().includes(search.toLowerCase()) && !log.counterparties?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inp = { background: C.bg2, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none" };
  const sel = { ...inp, appearance: "none", cursor: "pointer" };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// CORRESPONDENCE</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>Communication Log</div>
        <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>{filtered.length} correspondence entries</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginBottom: 20 }}>
        <input style={{ ...inp, width: "100%" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search correspondence content..."/>
        <select style={{ ...sel, width: "100%" }} value={filterCP} onChange={e => setFilterCP(e.target.value)}>
          <option value="all">All Counterparties</option>
          {counterparties.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
        </select>
      </div>

      {loading && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "40px 0" }}>LOADING...</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>No Correspondence Yet</div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>GO TO A COUNTERPARTY AND ADD CORRESPONDENCE FROM THE CORRESPONDENCE TAB</div>
          <button style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" }}
            onClick={() => setView("counterparties")}>GO TO COUNTERPARTIES</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(log => {
          let flags = [];
          try { flags = JSON.parse(log.flags || "[]"); } catch(e) {}
          return (
            <div key={log.id} style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.15em" }}>{log.source}</span>
                    <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>&#8250;</span>
                    <span style={{ fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, color: C.white, cursor: "pointer" }}
                      onClick={() => { const cp = counterparties.find(c => c.id === log.counterparty_id); if (cp) { setActiveCP(cp); setView("counterparty-detail"); } }}>
                      {log.counterparties?.name || "Unknown"}
                    </span>
                  </div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>{new Date(log.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => deleteLog(log.id)} style={{ padding: "4px 12px", background: "transparent", border: `1px solid rgba(224,82,82,0.3)`, color: C.danger, fontFamily: C.fontMono, fontSize: 9, letterSpacing: "0.1em", cursor: "pointer" }}>DELETE</button>
              </div>

              <div style={{ fontSize: 12, color: C.silverDim, lineHeight: 1.6, fontWeight: 300, marginBottom: 12, borderLeft: `2px solid rgba(16,157,206,0.2)`, paddingLeft: 12, maxHeight: 80, overflow: "hidden" }}>
                {log.content}
              </div>

              {log.ai_analysis && (
                <div style={{ fontSize: 13, color: C.silver, lineHeight: 1.7, fontWeight: 300, marginBottom: 10 }}>{log.ai_analysis}</div>
              )}

              {flags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {flags.map((flag, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span style={{ fontFamily: C.fontMono, fontSize: 8, padding: "2px 6px", border: `1px solid ${flagColor(flag.level)}`, background: flagColor(flag.level) + "33", color: flagColor(flag.level) }}>{flagLabel(flag.level)}</span>
                      <span style={{ color: C.silverDim, fontWeight: 300 }}>{flag.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
