import { useState } from "react";
import { DEFAULT_TEAM } from "../../constants.js";

export function CreateProjectWizard({ onComplete, onBack }){
  const [step,      setStep]     = useState(1);
  const [projName,  setProjName] = useState("");
  const [projCode,  setProjCode] = useState("");
  const [adminPw,   setAdminPw]  = useState("");
  const [projDesc,  setProjDesc] = useState("");
  const [pwType,    setPwType]   = useState("password");
  const [tasks,     setTasks]    = useState([
    { id:1, desc:"", owner:DEFAULT_TEAM[0].id, start:"", end:"", status:"Not Started", pri:"Medium", pct:0, deps:"", notes:"" },
  ]);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  function addTask(){
    const nid = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 1;
    setTasks(ts => [...ts, { id:nid, desc:"", owner:DEFAULT_TEAM[0].id, start:"", end:"", status:"Not Started", pri:"Medium", pct:0, deps:"", notes:"" }]);
  }
  function updTask(i,k,v){ setTasks(ts => ts.map((t,j) => j===i ? {...t,[k]:v} : t)); }
  function removeTask(i){ setTasks(ts => ts.filter((_,j) => j!==i)); }

  async function handleSave(){
    if (!projName.trim()||!projCode.trim()||!adminPw.trim()){ setErr("Project name, code and admin password are required."); return; }
    if (tasks.some(t=>!t.desc.trim())){ setErr("All tasks must have a description."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/create-project", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ projectCode:projCode.toUpperCase(), projectName:projName, description:projDesc, adminPassword:adminPw, tasks }),
      });
      if (!res.ok){ const e = await res.json(); throw new Error(e.error||"Save failed"); }
      onComplete({ projectName:projName, projectCode:projCode.toUpperCase(), adminPassword:adminPw, tasks });
    } catch(e){ setErr(`Failed to save: ${e.message}`); }
    finally{ setSaving(false); }
  }

  const fi = { width:"100%", padding:"9px 12px", border:"1.5px solid #D8F3DC", borderRadius:9, fontSize:13, color:"#1C2B22", background:"#fff", boxSizing:"border-box" };
  const pBtn = (bg,fg,mt=0,disabled=false) => ({ width:"100%", padding:"12px 0", borderRadius:10, border:bg==="transparent"?"1.5px solid #D8F3DC":"none", background:disabled?"#aaa":bg, color:fg, fontSize:14, fontWeight:700, cursor:disabled?"wait":"pointer", marginTop:mt, opacity:disabled?.7:1 });

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:28, maxWidth:540, width:"100%", margin:"0 auto", maxHeight:"85vh", overflowY:"auto" }}>
      {/* Progress bar */}
      <div style={{ display:"flex", gap:6, marginBottom:22 }}>
        {[1,2].map((s,i) => <div key={i} style={{ flex:1, height:4, borderRadius:99, background:step>=s?"#1A3C2E":"#D8F3DC", transition:"background .3s" }}/>)}
      </div>

      {/* Step 1 — Project details */}
      {step===1 && <>
        <div style={{ fontSize:22, marginBottom:8 }}>🏗</div>
        <h3 style={{ margin:"0 0 4px", color:"#1A3C2E", fontSize:18 }}>Project Setup</h3>
        <p style={{ color:"#607466", fontSize:13, margin:"0 0 18px" }}>Enter your project details. The code is used to log in.</p>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"#607466", display:"block", marginBottom:4 }}>PROJECT NAME</label>
          <input style={fi} placeholder="e.g. Oxford Debate 2026" value={projName}
            onChange={e=>{ setProjName(e.target.value); setProjCode(e.target.value.replace(/\s+/g,"").toUpperCase().slice(0,8)); }}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"#607466", display:"block", marginBottom:4 }}>PROJECT CODE (max 8 chars)</label>
          <input style={fi} placeholder="e.g. OXF2026" value={projCode} onChange={e=>setProjCode(e.target.value.toUpperCase().slice(0,8))}/>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"#607466", display:"block", marginBottom:4 }}>ADMIN PASSWORD</label>
          <div style={{ position:"relative" }}>
            <input style={fi} type={pwType} placeholder="Choose a secure password" value={adminPw} onChange={e=>setAdminPw(e.target.value)}/>
            <button type="button" onClick={()=>setPwType(t=>t==="password"?"text":"password")}
              style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#607466", fontWeight:600 }}>
              {pwType==="password"?"Show":"Hide"}
            </button>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"#607466", display:"block", marginBottom:4 }}>DESCRIPTION (optional)</label>
          <textarea style={{ ...fi, height:64, resize:"vertical" }} placeholder="Brief project description…" value={projDesc} onChange={e=>setProjDesc(e.target.value)}/>
        </div>

        {err && <div style={{ color:"#8B1A1A", fontSize:12, padding:"7px 10px", background:"#FFE0E0", borderRadius:7, marginBottom:10 }}>{err}</div>}
        <button style={pBtn("#1A3C2E","#fff")} onClick={()=>{ if(!projName||!projCode||!adminPw){ setErr("All fields required."); return; } setErr(""); setStep(2); }}>
          Next: Add Tasks →
        </button>
        <button style={pBtn("transparent","#607466",8)} onClick={onBack}>Back</button>
      </>}

      {/* Step 2 — Tasks */}
      {step===2 && <>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h3 style={{ margin:0, color:"#1A3C2E", fontSize:18 }}>Add Tasks</h3>
            <p style={{ color:"#607466", fontSize:13, margin:"3px 0 0" }}>{tasks.length} task{tasks.length!==1?"s":""}</p>
          </div>
          <button onClick={addTask} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#1A3C2E", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>+ Add Task</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16, maxHeight:380, overflowY:"auto", paddingRight:4 }}>
          {tasks.map((t,i) => (
            <div key={t.id} style={{ border:"1.5px solid #D8F3DC", borderRadius:10, padding:"12px 14px", background:"#EBF7EE" }}>
              <div style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#607466", minWidth:20 }}>#{t.id}</span>
                <input style={{ ...fi, marginBottom:0, flex:1 }} placeholder="Task description (required)" value={t.desc} onChange={e=>updTask(i,"desc",e.target.value)}/>
                <button onClick={()=>removeTask(i)} style={{ padding:"5px 9px", borderRadius:6, border:"1px solid #FFE0E0", background:"#FFE0E0", color:"#8B1A1A", cursor:"pointer", fontSize:12, flexShrink:0 }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"#607466", display:"block", marginBottom:2 }}>OWNER</label>
                  <select style={{ ...fi, marginBottom:0, fontSize:12 }} value={t.owner} onChange={e=>updTask(i,"owner",e.target.value)}>
                    {DEFAULT_TEAM.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"#607466", display:"block", marginBottom:2 }}>PRIORITY</label>
                  <select style={{ ...fi, marginBottom:0, fontSize:12 }} value={t.pri} onChange={e=>updTask(i,"pri",e.target.value)}>
                    {["Low","Medium","High","Critical"].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"#607466", display:"block", marginBottom:2 }}>START DATE</label>
                  <input style={{ ...fi, marginBottom:0, fontSize:12 }} type="date" value={t.start} onChange={e=>updTask(i,"start",e.target.value)}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"#607466", display:"block", marginBottom:2 }}>END DATE</label>
                  <input style={{ ...fi, marginBottom:0, fontSize:12 }} type="date" value={t.end} onChange={e=>updTask(i,"end",e.target.value)}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {err && <div style={{ color:"#8B1A1A", fontSize:12, padding:"7px 10px", background:"#FFE0E0", borderRadius:7, marginBottom:10 }}>{err}</div>}
        <button style={pBtn("#1A3C2E","#fff",0,saving)} onClick={handleSave}>
          {saving ? "Saving to Database…" : "💾 Save Project to Database"}
        </button>
        <button style={pBtn("transparent","#607466",8)} onClick={()=>setStep(1)}>Back</button>
      </>}
    </div>
  );
}
