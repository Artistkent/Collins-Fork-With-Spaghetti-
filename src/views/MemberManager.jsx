import { useState } from "react";
import { B, ROLE_DEFS, AREA_COLOR } from "../constants.js";
import { Card, SecHead, Avatar } from "../components/primitives.jsx";

const EDITABLE_ROLES = ["admin","pm","member","raci_only","viewer"];
const ROLE_LABELS = {
  admin:     "Admin — full access",
  pm:        "Project Manager — can edit tasks, cannot delete",
  member:    "Committee Member — status & notes only",
  raci_only: "RACI Assignee — can only update their own RACI cells",
  viewer:    "Viewer — read-only",
};

const AREAS = ["Strategy","Operations","Training","Comms","Media","Other"];

function blankMember(projectCode){
  return { id:"", name:"", role:"", area:"Strategy", resp:"", password:"", systemRole:"member", projectCode };
}

export function MemberManager({ projectCode, team, onTeamUpdate, setToast }){
  const [showForm,  setShowForm] = useState(false);
  const [editing,   setEditing]  = useState(null); // member id being edited
  const [form,      setForm]     = useState(blankMember(projectCode));
  const [saving,    setSaving]   = useState(false);
  const [err,       setErr]      = useState("");
  const [pwVisible, setPwVisible]= useState(false);

  function startNew(){
    setForm(blankMember(projectCode));
    setEditing(null);
    setShowForm(true);
    setErr("");
  }

  function startEdit(member){
    setForm({ ...member, password:"", projectCode }); // don't pre-fill password
    setEditing(member.id);
    setShowForm(true);
    setErr("");
  }

  function cancelForm(){
    setShowForm(false);
    setEditing(null);
    setErr("");
  }

  function upd(k,v){ setForm(f=>({...f,[k]:v})); }

  async function handleSave(){
    if (!form.id.trim())   { setErr("Member ID is required (e.g. 'alice')."); return; }
    if (!form.name.trim()) { setErr("Full name is required."); return; }
    if (!form.role.trim()) { setErr("Job title / role is required."); return; }
    if (!editing && !form.password.trim()){ setErr("Password is required for new members."); return; }

    // ID must be lowercase alphanum
    const cleanId = form.id.trim().toLowerCase().replace(/[^a-z0-9_]/g,"");
    if (!cleanId){ setErr("ID must be alphanumeric (letters and numbers only)."); return; }
    if (!editing && team.find(m=>m.id===cleanId)){ setErr(`ID "${cleanId}" is already taken.`); return; }

    setSaving(true); setErr("");
    try {
      const payload = {
        ...form,
        id: cleanId,
        projectCode,
        isEdit: !!editing,
      };
      const res = await fetch("/api/members", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok){ throw new Error(data.error||"Save failed"); }

      // Update local team state
      const updated = editing
        ? team.map(m=>m.id===cleanId ? { ...m, ...payload, password:undefined } : m)
        : [...team, { id:cleanId, name:form.name, role:form.role, area:form.area, resp:form.resp, systemRole:form.systemRole }];
      onTeamUpdate(updated);
      setToast(editing ? `✓ ${form.name} updated` : `✓ ${form.name} added to project`);
      setShowForm(false);
      setEditing(null);
    } catch(e){
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(member){
    if (!window.confirm(`Remove ${member.name} from this project?\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/members?project_code=${projectCode}&member_id=${member.id}`, { method:"DELETE" });
      if (!res.ok){ const e=await res.json(); throw new Error(e.error||"Remove failed"); }
      onTeamUpdate(team.filter(m=>m.id!==member.id));
      setToast(`${member.name} removed`);
    } catch(e){
      setToast(`⚠ ${e.message}`);
    }
  }

  const fi = { width:"100%", padding:"9px 12px", border:`1.5px solid ${B.pl}`, borderRadius:9, fontSize:13, color:B.tx, background:"#fff", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <SecHead title="Member Manager" sub="Add team members and set their access level. RACI Assignees can only update their own RACI cells."/>
        {!showForm && (
          <button onClick={startNew}
            style={{ background:B.dk, color:"#fff", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
            + Add Member
          </button>
        )}
      </div>

      {/* Role legend */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, color:B.dk, marginBottom:10 }}>🔑 Access Levels</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {EDITABLE_ROLES.map(r => {
            const def = ROLE_DEFS[r];
            return (
              <div key={r} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:def.badge, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:B.tx }}><b style={{ color:B.dk }}>{def.label}</b> — {ROLE_LABELS[r].split("—")[1]?.trim()}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add / Edit form */}
      {showForm && (
        <Card style={{ marginBottom:14, border:`2px solid ${B.ac}` }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:16 }}>
            {editing ? "✏️ Edit Member" : "➕ New Member"}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>LOGIN ID (lowercase)</label>
              <input style={fi} placeholder="e.g. alice" value={form.id}
                onChange={e=>upd("id",e.target.value.toLowerCase())} disabled={!!editing}/>
              {editing && <div style={{ fontSize:10, color:B.tg, marginTop:3 }}>ID cannot be changed after creation</div>}
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>FULL NAME</label>
              <input style={fi} placeholder="e.g. Alice Smith" value={form.name} onChange={e=>upd("name",e.target.value)}/>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>JOB TITLE / ROLE</label>
              <input style={fi} placeholder="e.g. Events Manager" value={form.role} onChange={e=>upd("role",e.target.value)}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>AREA</label>
              <select style={fi} value={form.area} onChange={e=>upd("area",e.target.value)}>
                {AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>ACCESS LEVEL</label>
            <select style={fi} value={form.systemRole} onChange={e=>upd("systemRole",e.target.value)}>
              {EDITABLE_ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {form.systemRole==="raci_only" && (
              <div style={{ marginTop:6, padding:"8px 12px", background:"#EBF7EE", borderRadius:8, fontSize:11, color:B.md }}>
                ℹ️ RACI Assignees can only see Home, RACI, and Report tabs. On the RACI tab they can only change cells on tasks where they are assigned as owner.
              </div>
            )}
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>
              {editing ? "NEW PASSWORD (leave blank to keep existing)" : "PASSWORD"}
            </label>
            <div style={{ position:"relative" }}>
              <input style={fi} type={pwVisible?"text":"password"} placeholder={editing?"Leave blank to keep current":"Enter a password"}
                value={form.password} onChange={e=>upd("password",e.target.value)}/>
              <button type="button" onClick={()=>setPwVisible(v=>!v)}
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:12, color:B.tg, fontWeight:600 }}>
                {pwVisible?"Hide":"Show"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4 }}>RESPONSIBILITIES (optional)</label>
            <textarea style={{ ...fi, height:60, resize:"vertical" }} placeholder="What are they responsible for?" value={form.resp} onChange={e=>upd("resp",e.target.value)}/>
          </div>

          {err && <div style={{ color:"#8B1A1A", fontSize:12, padding:"7px 10px", background:"#FFE0E0", borderRadius:7, marginBottom:10 }}>{err}</div>}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex:2, background:saving?"#888":B.dk, color:"#fff", padding:"12px 0", borderRadius:10, fontSize:14, fontWeight:700, border:"none", cursor:saving?"wait":"pointer" }}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Member"}
            </button>
            <button onClick={cancelForm}
              style={{ flex:1, background:B.pl, color:B.md, padding:"12px 0", borderRadius:10, fontSize:14, fontWeight:600, border:"none", cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Existing members */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {team.map(m => {
          const roleDef = ROLE_DEFS[m.systemRole || "member"];
          return (
            <Card key={m.id} style={{ display:"flex", alignItems:"center", gap:14 }}>
              <Avatar name={m.name} area={m.area} size={42}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:14, color:B.dk }}>{m.name}</span>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:roleDef?.badge||B.ac, color:"#fff", fontWeight:700 }}>
                    {roleDef?.label || m.systemRole}
                  </span>
                </div>
                <div style={{ fontSize:11, color:B.ac, fontWeight:600, marginTop:2 }}>{m.role}</div>
                {m.resp && <div style={{ fontSize:11, color:B.tg, marginTop:2, lineHeight:1.4 }}>{m.resp}</div>}
                <div style={{ fontSize:10, color:B.tg, marginTop:3 }}>Login ID: <code style={{ background:B.pl, padding:"1px 5px", borderRadius:4 }}>{m.id}</code></div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                <button onClick={()=>startEdit(m)}
                  style={{ padding:"6px 14px", borderRadius:8, background:B.pl, color:B.md, fontSize:12, fontWeight:700, border:"none", cursor:"pointer" }}>
                  Edit
                </button>
                <button onClick={()=>handleRemove(m)}
                  style={{ padding:"6px 14px", borderRadius:8, background:"#FFE0E0", color:"#8B1A1A", fontSize:12, fontWeight:700, border:"none", cursor:"pointer" }}>
                  Remove
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {team.length===0 && (
        <Card style={{ textAlign:"center", padding:32 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>👥</div>
          <div style={{ fontSize:14, color:B.dk, fontWeight:600, marginBottom:6 }}>No members yet</div>
          <div style={{ fontSize:12, color:B.tg }}>Click "Add Member" to invite your first team member.</div>
        </Card>
      )}
    </div>
  );
}
