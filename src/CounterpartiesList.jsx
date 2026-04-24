import { useState } from "react";
import { C } from "./theme";

export default function CounterpartiesList({ counterparties, setView, setActiveCP, profile }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("updated");

  function scoreColor(s) {
    if (s >= 80) return C.safe;
    if (s >= 60) return "#90EE90";
    if (s >= 40) return C.warn;
    return C.danger;
  }

  function verdictLabel(s) {
    if (s >= 80) return "HIGH TRUST";
    if (s >= 60) return "MODERATE";
    if (s >= 40) return "ELEVATED RISK";
    return "HIGH RISK";
  }

  const filtered = counterparties
    .filter(cp => {
      if (search && !cp.name.toLowerCase().includes(search.toLowerCase()) && !cp.country?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "high-trust" && cp.score < 80) return false;
      if (filter === "high-risk" && cp.score >= 40) return false;
      if (filter === "unassessed" && cp.score) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "updated") return new Date(b.updated_at) - new Date(a.updated_at);
      if (sort === "score-high") return (b.score || 0) - (a.score || 0);
      if (sort === "score-low") return (a.score || 0) - (b.score || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const inp = { background: C.bg2, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "10px 14px", outline: "none" };
  const sel = { ...inp, appearance: "none", cursor: "pointer" };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.25em", marginBottom: 6 }}>// COUNTERPARTY INTELLIGENCE</div>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 28, fontWeight: 700, color: C.white }}>Counterparties</div>
          <div style={{ fontSize: 13, color: C.silverDim, fontWeight: 300, marginTop: 4 }}>{filtered.length} of {counterparties.length} counterparties</div>
        </div>
        {profile?.role !== "restricted" && (
          <button style={{ padding: "12px 24px", background: "rgba(16,157,206,0.08)", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
            onClick={() => setView("assessment")}>
            + NEW ASSESSMENT
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px", gap: 12, marginBottom: 20 }}>
        <input style={{ ...inp, width: "100%" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or country..."/>
        <select style={{ ...sel, width: "100%" }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Counterparties</option>
          <option value="high-trust">High Trust Only</option>
          <option value="high-risk">High Risk Only</option>
          <option value="unassessed">Not Yet Assessed</option>
        </select>
        <select style={{ ...sel, width: "100%" }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="updated">Recently Updated</option>
          <option value="score-high">Highest Score</option>
          <option value="score-low">Lowest Score</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: C.bg2, border: `1px dashed ${C.cyanBorder}`, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>
            {counterparties.length === 0 ? "No Counterparties Yet" : "No Results Found"}
          </div>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 24 }}>
            {counterparties.length === 0 ? "START YOUR FIRST TRUST ASSESSMENT" : "TRY ADJUSTING YOUR SEARCH OR FILTERS"}
          </div>
          {counterparties.length === 0 && profile?.role !== "restricted" && (
            <button style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.cyan}`, color: C.cyan, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
              onClick={() => setView("assessment")}>
              START FIRST ASSESSMENT
            </button>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(cp => (
          <div key={cp.id}
            style={{ background: C.bg2, border: `1px solid ${cp.score ? scoreColor(cp.score) + "44" : C.cyanBorder}`, borderLeft: `3px solid ${cp.score ? scoreColor(cp.score) : C.cyanBorder}`, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => { setActiveCP(cp); setView("counterparty-detail"); }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ fontFamily: C.fontDisplay, fontSize: 17, fontWeight: 600, color: C.white }}>{cp.name}</div>
                {cp.score && <span style={{ fontFamily: C.fontMono, fontSize: 8, padding: "2px 8px", border: `1px solid ${scoreColor(cp.score)}`, color: scoreColor(cp.score), background: scoreColor(cp.score) + "22", letterSpacing: "0.1em" }}>{verdictLabel(cp.score)}</span>}
                {!cp.score && <span style={{ fontFamily: C.fontMono, fontSize: 8, padding: "2px 8px", border: `1px solid ${C.silverDim}`, color: C.silverDim, letterSpacing: "0.1em" }}>UNASSESSED</span>}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {cp.country && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>&#127758; {cp.country}</span>}
                {cp.tx_type && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>&#9670; {cp.tx_type}</span>}
                {cp.tx_value && <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>&#36; {cp.tx_value}</span>}
                <span style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>Updated {new Date(cp.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, marginLeft: 20 }}>
              {cp.score && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: C.fontDisplay, fontSize: 32, fontWeight: 700, color: scoreColor(cp.score), lineHeight: 1 }}>{cp.score}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 7, color: C.silverDim, letterSpacing: "0.1em" }}>TRUST SCORE</div>
                </div>
              )}
              <span style={{ color: C.silverDim, fontSize: 14 }}>&#9654;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
