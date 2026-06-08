import { useState, useEffect } from "react";
import { B, memberObj } from "../constants.js";
import { Card, SecHead } from "../components/primitives.jsx";

const DB_FIELDS = [
  { key:"desc",   label:"Description",  type:"text"     },
  { key:"owner",  label:"Owner",        type:"select"   },
  { key:"start",  label:"Start Date",   type:"date"     },
  { key:"end",    label:"End Date",     type:"date"     },
  { key:"status", label:"Status",       type:"select"   },
  { key:"pri",    label:"Priority",     type:"select"   },
  { key:"pct",    label:"% Done",       type:"number"   },
  { key:"deps",   label:"Dependencies", type:"text"     },
  { key:"notes",  label:"Notes",        type:"textarea" },
];
const DB_STATUS = ["Not Started","In Progress","Complete"];
const DB_PRI    = ["Low","Medium","High","Critical"];

const LBL = { display:"block", fontSize:11, fontWeight:700, color:B.tg, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 };
const INP = { width:"100%", padding:"9px 11px", border:`1.5px solid ${B.pl}`, borderRadius:9, color:B.tx, background:B.st, fontSize:13, boxSizing:"border-box" };
const INP_ON = { ...INP, border:`1.5px solid ${B.ac}`, background:"#fff" };

function FieldRow({ fkey, label, type, mode, enabled, fields, team, onToggle, onUpdate }){
  const on  = mode==="create" || !!enabled[fkey];
  const val = fields[fkey] ?? "";
  const disabled = mode==="edit" && !enabled[fkey];
  const s = on ? INP_ON : INP;

  const ctrl =
    type==="text"      ? <input style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)} placeholder={fkey==="deps"?"e.g. 3,5":""}/>
    : type==="date"    ? <input style={s} type="date" disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}/>
    : type==="number"  ? <input style={s} type="number" min={0} max={100} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,parseInt(e.target.value)||0)}/>
    : type==="textarea"? <textarea style={{ ...s, height:64, resize:"vertical" }} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}/>
    : fkey==="owner"   ? <select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{team.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
    : fkey==="status"  ? <select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{DB_STATUS.map(v=><option key={v}>{v}</option>)}</select>
    : fkey==="pri"     ? <select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{DB_PRI.map(v=><option key={v}>{v}</option>)}</select>
    : null;

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
      {mode==="edit" && (
        <input type="checkbox" checked={!!enabled[fkey]} onChange={()=>onToggle(fkey)}
          style={{ marginTop:12, flexShrink:0, width:16, height:16, accentColor:B.ac }}/>
      )}
      <div style={{ flex:1 }}>
        <label style={LBL}>{label}</label>
        {ctrl}
      </div>
    </div>
  );
}

const BLANK = { desc:"", owner:"", start:"", end:"", status:"Not Started", pri:"Medium", pct:0, deps:"", notes:"" };

export function EditTasks({ tasks, setTasks, team, setToast, canEdit, canCreate, projectCode }){
  const [mode,       setMode]      = useState("edit");
  const [selId,      setSelId]     = useState("");
  const [fields,     setFields]    = useState({});
  const [enabled,    setEnabled]   = useState({});
  const [result,     setResult]    = useState(null);
  const [submitting, setSubmitting]= useState(false);

  const selectedTask = tasks.find(t=>String(t.id)===String(selId));
  const nextId       = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 1;

  function switchMode(m){
    setMode(m);
    setSelId("");
    setResult(null);
    setFields(m==="create"?{...BLANK}:{});
    setEnabled({});
  }

  useEffect(()=>{
    if (mode!=="edit"||!selectedTask){ if(mode==="edit"){ setFields({}); setEnabled({}); } return; }
    const f = {};
    DB_FIELDS.forEach(({key})=>{ f[key]=selectedTask[key]??""; });
    setFields(f); setEnabled({}); setResult(null);
  }, [selId, mode]);

  function toggle(key){ setEnabled(e=>({...e,[key]:!e[key]})); }
  function upd(key,val){ setFields(f=>({...f,[key]:val})); }

  async function pushToDb(payload, isNew){
    if (payload.status==="Complete") payload.pct=100;
    payload.updatedAt = Date.now();
    setSubmitting(true); setResult(null);
    if (isNew) setTasks(prev=>[...prev,payload]);
    else       setTasks(prev=>prev.map(t=>t.id===payload.id?payload:t));
    try {
      const res = await fetch("/api/update-task",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...payload,project_code:projectCode}) });
      if (res.status===404) throw new Error("API not reachable. Local state updated.");
      const data = await res.json();
      if (!res.ok||!data.ok) throw new Error(data.error||"Request failed");
      setResult({ ok:true, msg:isNew?`Task #${payload.id} created in database.`:`Task #${payload.id} updated in database.` });
      setToast(isNew?`Task #${payload.id} created`:`Task #${payload.id} updated`);
      if (isNew) setFields({...BLANK});
      else setEnabled({});
    } catch(err){
      setResult({ ok:false, msg:`Local state updated but DB push failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  }

  function submitEdit(){
    if (!selectedTask){ setResult({ ok:false, msg:"Please select a task first." }); return; }
    const activeKeys = Object.keys(enabled).filter(k=>enabled[k]);
    if (activeKeys.length===0){ setResult({ ok:false, msg:"Enable at least one field to update." }); return; }
    const patch = { ...selectedTask };
    activeKeys.forEach(k=>{ patch[k]=fields[k]; });
    pushToDb(patch, false);
  }

  function submitCreate(){
    if (!fields.desc?.trim()){ setResult({ ok:false, msg:"Description is required." }); return; }
    if (!fields.start||!fields.end){ setResult({ ok:false, msg:"Start and End dates are required." }); return; }
    pushToDb({ id:nextId,...fields,pct:Number(fields.pct)||0 }, true);
  }

  return (
    <div>
      <SecHead title="Edit Tasks" sub={canCreate?"Create new tasks or update existing ones in the database.":"Update the status, progress and notes for your assigned tasks."}/>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[["edit","Edit Existing"],...(canCreate?[["create","+ Create New"]]:[])].map(([m,lab])=>(
          <button key={m} onClick={()=>switchMode(m)}
            style={{ flex:1, padding:"10px 0", borderRadius:10, fontSize:13, fontWeight:700, border:`2px solid ${mode===m?B.ac:B.pl}`, background:mode===m?B.ac:B.wh, color:mode===m?"#fff":B.tg, cursor:"pointer", transition:"all .15s" }}>
            {lab}
          </button>
        ))}
      </div>

      {mode==="edit" && <>
        <Card style={{ marginBottom:14 }}>
          <label style={LBL}>Select Task to Edit</label>
          <select style={{ ...INP, marginBottom:selId?12:0 }} value={selId} onChange={e=>setSelId(e.target.value)}>
            <option value="">— choose a task —</option>
            {tasks.map(t=><option key={t.id} value={t.id}>#{t.id} {t.desc.length>55?t.desc.slice(0,55)+"...":t.desc}</option>)}
          </select>
          {selectedTask && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, paddingTop:4 }}>
              {[["Owner",memberObj(selectedTask.owner,team).name.split(" ")[0]],["Status",selectedTask.status],["Priority",selectedTask.pri],["Progress",`${selectedTask.pct}%`]].map(([k,v])=>(
                <span key={k} style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:B.pl, color:B.md, fontWeight:600 }}>{k}: {v}</span>
              ))}
            </div>
          )}
        </Card>

        {selectedTask && <>
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:B.tg, marginBottom:14 }}>Toggle the checkbox next to each field to enable it, then click <b style={{ color:B.dk }}>Push Update to Database</b>.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {DB_FIELDS.filter(f=>canEdit.includes(f.key)).map(f=>(
                <FieldRow key={f.key} fkey={f.key} label={f.label} type={f.type} mode={mode} enabled={enabled} fields={fields} team={team} onToggle={toggle} onUpdate={upd}/>
              ))}
            </div>
          </Card>
          <button onClick={submitEdit} disabled={submitting||Object.values(enabled).every(v=>!v)}
            style={{ width:"100%", background:submitting?"#888":B.dk, color:"#fff", padding:"13px 0", borderRadius:12, fontSize:14, fontWeight:700, border:"none", cursor:submitting?"wait":"pointer", marginBottom:10, transition:"background .2s" }}>
            {submitting?"Pushing to database...":"Push Update to Database"}
          </button>
          {result && <div style={{ padding:"10px 14px", borderRadius:10, background:result.ok?"#C6EFCE":"#FFE0E0", color:result.ok?"#1A5C2A":"#8B1A1A", fontSize:13, fontWeight:600 }}>{result.msg}</div>}
        </>}
      </>}

      {mode==="create" && <>
        <Card style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:12, color:B.tg }}>Fill in all fields. Description, Start and End are required.</div>
            <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:B.pl, color:B.md, fontWeight:700 }}>New ID: #{nextId}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {DB_FIELDS.map(f=>(
              <FieldRow key={f.key} fkey={f.key} label={f.label} type={f.type} mode={mode} enabled={enabled} fields={fields} team={team} onToggle={toggle} onUpdate={upd}/>
            ))}
          </div>
        </Card>
        <button onClick={submitCreate} disabled={submitting}
          style={{ width:"100%", background:submitting?"#888":B.ac, color:"#fff", padding:"13px 0", borderRadius:12, fontSize:14, fontWeight:700, border:"none", cursor:submitting?"wait":"pointer", marginTop:8, marginBottom:10, transition:"background .2s" }}>
          {submitting?"Creating task...":"+ Create Task in Database"}
        </button>
        {result && <div style={{ padding:"10px 14px", borderRadius:10, background:result.ok?"#C6EFCE":"#FFE0E0", color:result.ok?"#1A5C2A":"#8B1A1A", fontSize:13, fontWeight:600 }}>{result.msg}</div>}
      </>}
    </div>
  );
}
