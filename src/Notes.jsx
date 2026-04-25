import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { C } from "./theme";

export default function Notes({ counterpartyId, workspaceId, userId, profile }) {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPos, setCursorPos] = useState(0);

  useEffect(() => { loadNotes(); loadTeammates(); }, [counterpartyId]);

  async function loadNotes() {
    setLoading(true);
    const { data } = await supabase
      .from("notes")
      .select("*, profiles(id, email, full_name, company)")
      .eq("counterparty_id", counterpartyId)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  }

  async function loadTeammates() {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, company")
      .eq("workspace_id", workspaceId)
      .neq("id", userId);
    if (data) setTeammates(data);
  }

  function handleContentChange(e) {
    const val = e.target.value;
    setContent(val);
    const pos = e.target.selectionStart;
    setCursorPos(pos);
    const textUpToCursor = val.slice(0, pos);
    const atMatch = textUpToCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionSearch(atMatch[1].toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  }

  function insertMention(teammate) {
    const textUpToCursor = content.slice(0, cursorPos);
    const atIndex = textUpToCursor.lastIndexOf("@");
    const newContent = content.slice(0, atIndex) + `@${teammate.full_name || teammate.email.split("@")[0]} ` + content.slice(cursorPos);
    setContent(newContent);
    setShowMentions(false);
    setMentionSearch("");
  }

  function extractMentionIds(text) {
    const mentioned = [];
    teammates.forEach(t => {
      const name = t.full_name || t.email.split("@")[0];
      if (text.includes(`@${name}`)) mentioned.push(t.id);
    });
    return mentioned;
  }

  function formatContent(text, profiles) {
    if (!text) return text;
    let formatted = text;
    const allProfiles = profiles ? [profiles] : [];
    teammates.forEach(t => {
      const name = t.full_name || t.email.split("@")[0];
      formatted = formatted.replace(
        new RegExp(`@${name}`, "g"),
        `<span style="color: #109DCE; font-weight: 600;">@${name}</span>`
      );
    });
    return formatted;
  }

  async function submitNote() {
    if (!content.trim()) return;
    setSubmitting(true);
    const mentionIds = extractMentionIds(content);
    await supabase.from("notes").insert({
      counterparty_id: counterpartyId,
      workspace_id: workspaceId,
      user_id: userId,
      content: content.trim(),
      mentions: mentionIds
    });
    setContent("");
    setShowMentions(false);
    await loadNotes();
    setSubmitting(false);
  }

  async function deleteNote(id) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(notes.filter(n => n.id !== id));
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  }

  function getInitials(p) {
    if (!p) return "?";
    if (p.full_name) return p.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return p.email.slice(0, 2).toUpperCase();
  }

  function getDisplayName(p) {
    if (!p) return "Unknown";
    return p.full_name || p.email.split("@")[0];
  }

  const filteredTeammates = teammates.filter(t => {
    const name = (t.full_name || t.email).toLowerCase();
    return name.includes(mentionSearch);
  });

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.cyanBorder}`, color: C.silver, fontFamily: C.font, fontSize: 13, padding: "12px 14px", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6, fontWeight: 300 };

  return (
    <div style={{ padding: "0" }}>
      <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.cyan, letterSpacing: "0.2em", marginBottom: 16 }}>// TEAM NOTES</div>

      <div style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, padding: 20, marginBottom: 20, position: "relative" }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.1em", marginBottom: 8 }}>
          ADD NOTE <span style={{ color: C.cyan }}>// USE @ TO MENTION A TEAMMATE</span>
        </div>
        <textarea
          style={{ ...inp, minHeight: 100 }}
          value={content}
          onChange={handleContentChange}
          placeholder="Add a note, update, or tag a teammate with @name..."
        />

        {showMentions && filteredTeammates.length > 0 && (
          <div style={{ position: "absolute", background: C.bg2, border: `1px solid ${C.cyan}`, zIndex: 10, width: 240, maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            {filteredTeammates.map(t => (
              <div key={t.id}
                style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.cyanBorder}` }}
                onMouseDown={() => insertMention(t)}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(16,157,206,0.2)", border: `1px solid ${C.cyan}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fontMono, fontSize: 10, color: C.cyan, flexShrink: 0 }}>
                  {getInitials(t)}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{getDisplayName(t)}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim }}>{t.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>
            Posting as <span style={{ color: C.cyan }}>{getDisplayName(profile)}</span>
          </div>
          <button
            style={{ padding: "8px 24px", background: content.trim() ? "rgba(16,157,206,0.1)" : "transparent", border: `1px solid ${content.trim() ? C.cyan : C.cyanBorder}`, color: content.trim() ? C.cyan : C.silverDim, fontFamily: C.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: content.trim() ? "pointer" : "default" }}
            onClick={submitNote} disabled={submitting || !content.trim()}>
            {submitting ? "POSTING..." : "POST NOTE"}
          </button>
        </div>
      </div>

      {loading && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "20px 0" }}>LOADING NOTES...</div>}

      {!loading && notes.length === 0 && (
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.silverDim, letterSpacing: "0.1em", textAlign: "center", padding: "30px 0", background: C.bg2, border: `1px dashed ${C.cyanBorder}` }}>
          NO NOTES YET. BE THE FIRST TO ADD AN UPDATE.
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {notes.map(note => (
          <div key={note.id} style={{ background: C.bg2, border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${note.mentions?.length > 0 ? C.warn : C.cyan}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: note.user_id === userId ? "rgba(16,157,206,0.2)" : "rgba(210,221,225,0.1)", border: `1px solid ${note.user_id === userId ? C.cyan : C.cyanBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.fontMono, fontSize: 11, color: note.user_id === userId ? C.cyan : C.silverDim, flexShrink: 0 }}>
                  {getInitials(note.profiles)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{getDisplayName(note.profiles)}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.silverDim, letterSpacing: "0.08em" }}>{timeAgo(note.created_at)} // {new Date(note.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {note.mentions?.length > 0 && (
                  <span style={{ fontFamily: C.fontMono, fontSize: 8, padding: "2px 8px", border: `1px solid ${C.warn}`, color: C.warn, background: C.warn + "22", letterSpacing: "0.1em" }}>
                    {note.mentions.length} MENTION{note.mentions.length > 1 ? "S" : ""}
                  </span>
                )}
                {note.user_id === userId && (
                  <button onClick={() => deleteNote(note.id)} style={{ padding: "3px 10px", background: "transparent", border: `1px solid rgba(224,82,82,0.3)`, color: C.danger, fontFamily: C.fontMono, fontSize: 8, letterSpacing: "0.1em", cursor: "pointer" }}>DELETE</button>
                )}
              </div>
            </div>
            <div
              style={{ fontSize: 13, color: C.silver, lineHeight: 1.7, fontWeight: 300 }}
              dangerouslySetInnerHTML={{ __html: formatContent(note.content, note.profiles) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
