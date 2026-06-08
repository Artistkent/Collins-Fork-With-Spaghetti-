import { useState } from "react";
import { B } from "../constants.js";
import { Card, SecHead, Inp, Btn } from "../components/primitives.jsx";

// ── Project Brief view ────────────────────────────────────────────────────────
// Admin can edit the brief. All users can read it.
export function Brief({ brief, onSaveBrief, isAdmin }){
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(brief || "");
  const [saving,  setSaving]  = useState(false);

  async function save(){
    setSaving(true);
    await onSaveBrief(draft.trim());
    setSaving(false);
    setEditing(false);
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:12 }}>
        <SecHead title="Project Brief" sub="The purpose and background of this project." />
        {isAdmin && !editing && (
          <Btn onClick={() => { setDraft(brief||""); setEditing(true); }} variant="secondary" style={{ flexShrink:0 }}>
            ✏️ Edit
          </Btn>
        )}
      </div>

      {editing ? (
        <Card>
          <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>
            Project Brief
          </label>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Enter the project brief — purpose, scope, background, objectives…"
            style={{ width:"100%", minHeight:220, padding:"12px", border:`1.5px solid ${B.pl}`,
              borderRadius:9, fontSize:14, color:B.tx, lineHeight:1.7, resize:"vertical",
              boxSizing:"border-box", fontFamily:"inherit" }} />
          <div style={{ display:"flex", gap:10, marginTop:12 }}>
            <Btn onClick={save} disabled={saving} style={{ flex:1 }}>
              {saving ? "Saving…" : "Save Brief"}
            </Btn>
            <Btn onClick={() => setEditing(false)} variant="ghost" style={{ flex:1 }}>Cancel</Btn>
          </div>
        </Card>
      ) : (
        <Card>
          {brief?.trim() ? (
            <div style={{ fontSize:14, color:B.tm, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{brief}</div>
          ) : (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📄</div>
              <div style={{ fontSize:14, color:B.dk, fontWeight:600, marginBottom:6 }}>No brief yet</div>
              {isAdmin
                ? <div style={{ fontSize:12, color:B.tg }}>Click <b>Edit</b> above to add the project brief.</div>
                : <div style={{ fontSize:12, color:B.tg }}>The admin hasn't added a brief yet.</div>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
