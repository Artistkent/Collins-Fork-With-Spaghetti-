import { useState } from "react";
import { B, RACI_CYCLE, RACI_STYLE, fmtDate, memberObj, GANTT_DAYS, ganttOffset, ganttWidth } from "../constants.js";
import { SecHead, Avatar, Badge } from "../components/primitives.jsx";
import { TaskModal } from "../components/TaskModal.jsx";

export function RaciMatrix({ tasks, setTasks, team, raci, setRaci, auth, setToast, isMobile }){
  const [modal, setModal] = useState(null);

  const isRaciOnly = auth?.roleDef?.raciOnly === true;
  const myId       = auth?.memberId;

  // Can this user edit the RACI cell for a given task + member combo?
  function canEditCell(taskId, memberId){
    if (!isRaciOnly) return true;           // full roles can always edit
    const task = tasks.find(t=>t.id===taskId);
    return task?.owner === myId && memberId === myId; // RACI-only: only own row on own tasks
  }

  function toggleTaskDone(taskId){
    const t = tasks.find(x=>x.id===taskId);
    if (!t) return;
    const alreadyDone = t.status==="Complete";
    const newStatus   = alreadyDone?"Not Started":"Complete";
    const newPct      = alreadyDone?0:100;
    setTasks(ts=>ts.map(x=>x.id===taskId?{...x,status:newStatus,pct:newPct,updatedAt:Date.now()}:x));
    setToast(alreadyDone ? `↩ Task #${taskId} marked Not Started` : `✅ Task #${taskId} marked Complete`);
  }

  function cycleCell(taskId, memberId){
    if (!canEditCell(taskId, memberId)) return;
    setRaci(prev=>{
      const row = prev[taskId]||{};
      const cur = row[memberId]||"";
      const next = RACI_CYCLE[(RACI_CYCLE.indexOf(cur)+1) % RACI_CYCLE.length];
      return { ...prev, [taskId]:{ ...row, [memberId]:next } };
    });
  }

  async function handleSave(saved){
    const updated = { ...saved, updatedAt:Date.now() };
    setTasks(ts=>ts.map(t=>t.id===updated.id?updated:t));
    setModal(null);
    setToast(`✓ Task #${saved.id} updated — Gantt & Report synced`);
    try {
      await fetch("/api/update-task",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated) });
    } catch(e){ console.error(e); }
  }

  function handleDelete(id){
    setTasks(ts=>ts.filter(t=>t.id!==id));
    setModal(null);
    setToast("Task deleted");
  }

  const warns = tasks.filter(t=>{
    const r = raci[t.id]||{};
    const v = Object.values(r);
    return !v.includes("R")||!v.includes("A");
  });

  // RACI-only: only show tasks owned by this member
  const visibleTasks = isRaciOnly ? tasks.filter(t=>t.owner===myId) : tasks;

  return (
    <div>
      <SecHead
        title="RACI Matrix"
        sub={isRaciOnly
          ? `Showing your assigned tasks · You can update your own RACI cells`
          : "Tap ✓ to mark a task complete — auto-updates Gantt, Dashboard & Final Report"}
      />

      {isRaciOnly && (
        <div style={{ background:"#EBF7EE", border:`1px solid ${B.lt}`, borderRadius:10, padding:"12px 16px", marginBottom:14, fontSize:12, color:B.md }}>
          ℹ️ As a RACI Assignee, you can see all tasks assigned to you and update your own RACI cells. To change task status or other details, contact your project admin.
        </div>
      )}

      {!isRaciOnly && (
        <div style={{ background:"#EBF7EE", border:`1px solid ${B.lt}`, borderRadius:10, padding:"12px 16px", marginBottom:14, fontSize:12, color:B.md, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
          <div>
            <b style={{ display:"block", marginBottom:3 }}>How to mark actions complete:</b>
            Tap the <span style={{ background:"#1A5C2A", color:"#fff", borderRadius:6, padding:"1px 7px", fontSize:11, fontWeight:700 }}>✓</span> button to toggle tasks. Use <b>R/A/C/I cells</b> to adjust assignments.
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[["R","Responsible","#1A3C2E","#fff"],["A","Accountable","#40916C","#fff"],["C","Consulted","#D8F3DC","#1A3C2E"],["I","Informed","#e4e4e4","#555"]].map(([v,l,bg,fg])=>(
          <div key={v} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:B.wh, borderRadius:10, border:`1px solid ${B.pl}` }}>
            <div style={{ width:24, height:24, borderRadius:6, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:fg, flexShrink:0 }}>{v}</div>
            <div style={{ fontSize:11, color:B.dk, fontWeight:600 }}>{l}</div>
          </div>
        ))}
      </div>

      {warns.length>0 && !isRaciOnly && (
        <div style={{ background:"#FFF3CD", border:"1px solid #F0C040", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#7A5000" }}>
          ⚠ {warns.length} task{warns.length>1?"s":""} missing R or A: {warns.map(t=>`#${t.id}`).join(", ")}
        </div>
      )}

      <div style={{ overflowX:"auto", background:B.wh, borderRadius:12, border:`1px solid ${B.pl}`, WebkitOverflowScrolling:"touch" }}>
        <table style={{ borderCollapse:"collapse", minWidth:isMobile?680:820, width:"100%" }}>
          <thead>
            <tr style={{ background:B.dk }}>
              <th style={{ padding:"10px 8px",  textAlign:"left",   color:B.pl, fontSize:10, fontWeight:700, width:28,             position:"sticky", left:0,  background:B.dk, zIndex:2 }}>#</th>
              <th style={{ padding:"10px 10px", textAlign:"left",   color:B.pl, fontSize:10, fontWeight:700, minWidth:isMobile?120:170, position:"sticky", left:28, background:B.dk, zIndex:2 }}>Task</th>
              <th style={{ padding:"10px 8px",  textAlign:"center", color:B.pl, fontSize:10, fontWeight:700, minWidth:70 }}>Status</th>
              <th style={{ padding:"10px 8px",  textAlign:"center", color:B.pl, fontSize:10, fontWeight:700, minWidth:isMobile?70:100 }}>Timeline</th>
              {team.map(m=>(
                <th key={m.id} style={{ padding:"10px 6px", textAlign:"center", color:B.pl, fontSize:10, fontWeight:700, minWidth:56 }}>
                  <Avatar name={m.name} area={m.area} size={22}/>
                  <div style={{ marginTop:3, fontSize:9 }}>{m.name.split(" ")[0]}</div>
                </th>
              ))}
              {!isRaciOnly && <th style={{ padding:"10px 8px", textAlign:"center", color:B.pl, fontSize:10, fontWeight:700, minWidth:52 }}>Done</th>}
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((t,ri) => {
              const row = raci[t.id]||{};
              const isDone   = t.status==="Complete";
              const isRecent = t.updatedAt&&Date.now()-t.updatedAt<60000;
              const bg       = isRecent?"#FFFBEA":ri%2===0?B.wh:B.st;
              const hasR     = Object.values(row).includes("R");
              const hasA     = Object.values(row).includes("A");
              return (
                <tr key={t.id} style={{ background:bg, outline:isRecent?"2px solid #F0C040":"none" }}>
                  <td style={{ padding:"8px 8px", fontSize:10, color:B.tg, fontWeight:600, position:"sticky", left:0, background:isDone?"#C6EFCE":bg, zIndex:1 }}>{t.id}</td>
                  <td style={{ padding:"8px 10px", position:"sticky", left:28, background:isDone?"#C6EFCE":bg, zIndex:1, cursor:isRaciOnly?"default":"pointer" }}
                    onClick={()=>!isRaciOnly&&setModal(t)}>
                    {isRecent && <div style={{ fontSize:8, color:"#7A5000", fontWeight:700, marginBottom:2 }}>✦ UPDATED</div>}
                    <div style={{ fontSize:11, color:isDone?"#1A5C2A":B.tx, lineHeight:1.3, fontWeight:isDone?700:400 }}>
                      {isDone&&<span style={{ marginRight:4 }}>✅</span>}{t.id===17?"⭐ ":""}{t.desc}
                    </div>
                    {(!hasR||!hasA)&&!isRaciOnly&&<div style={{ fontSize:9, color:"#7A5000" }}>⚠ Missing {!hasR?"R":""}{!hasA&&!hasR?" & ":""}{!hasA?"A":""}</div>}
                  </td>
                  <td style={{ padding:"5px 6px", textAlign:"center", background:isDone?"#C6EFCE":undefined }}>
                    <Badge label={t.status} small/>
                    <div style={{ fontSize:9, color:B.tg, marginTop:3 }}>{t.pct}%</div>
                  </td>
                  <td style={{ padding:"5px 8px", background:isDone?"#C6EFCE":undefined }}>
                    <div style={{ height:6, borderRadius:99, background:B.st, overflow:"hidden", position:"relative", minWidth:isMobile?60:90 }}>
                      <div style={{ position:"absolute", left:`${Math.min(85,Math.round((ganttOffset(t.start)/GANTT_DAYS)*100))}%`, width:`${Math.max(2,Math.round((ganttWidth(t.start,t.end)/GANTT_DAYS)*100))}%`, height:"100%", background:t.status==="Complete"?B.dk:t.status==="In Progress"?B.ac:B.md, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:8, color:B.tg, marginTop:2, textAlign:"center" }}>{fmtDate(t.start)}</div>
                  </td>
                  {team.map(m => {
                    const v      = row[m.id]||"";
                    const rs     = RACI_STYLE[v]||RACI_STYLE[""];
                    const editable = canEditCell(t.id, m.id);
                    return (
                      <td key={m.id} style={{ padding:"5px 5px", textAlign:"center", background:isDone?"rgba(198,239,206,.3)":undefined }}>
                        <div
                          onClick={()=>editable&&cycleCell(t.id,m.id)}
                          title={editable?`${m.name}: ${v||"unassigned"}`:"You can only edit your own cells on your tasks"}
                          style={{ width:34, height:34, borderRadius:7, margin:"0 auto", background:rs.bg, color:rs.fg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, cursor:editable?"pointer":"default", border:v?"none":"1.5px dashed #ddd", userSelect:"none", WebkitTapHighlightColor:"transparent", transition:"transform .1s", opacity:editable?1:.4 }}
                          onMouseEnter={e=>{ if(editable) e.currentTarget.style.transform="scale(1.12)"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; }}>
                          {v||"+"}
                        </div>
                      </td>
                    );
                  })}
                  {!isRaciOnly && (
                    <td style={{ padding:"5px 6px", textAlign:"center" }}>
                      <div onClick={()=>toggleTaskDone(t.id)} title={isDone?"Click to mark Not Started":"Click to mark Complete"}
                        style={{ width:36, height:36, borderRadius:8, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", WebkitTapHighlightColor:"transparent", transition:"all .2s", background:isDone?"#1A5C2A":"transparent", border:isDone?"2px solid #1A5C2A":"2px dashed #74C69D", boxShadow:isDone?"0 2px 8px rgba(26,92,42,.3)":"none" }}
                        onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.12)"; if(!isDone)e.currentTarget.style.background="#D8F3DC"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; if(!isDone)e.currentTarget.style.background="transparent"; }}>
                        <span style={{ fontSize:16, color:isDone?"#fff":"#74C69D", fontWeight:700, lineHeight:1 }}>✓</span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:11, color:B.tg, marginTop:8 }}>
        {isRaciOnly
          ? "You can update your own RACI cell. Greyed cells are read-only."
          : "Tap ✓ to toggle task complete · updates Gantt, Dashboard & Final Report instantly · scroll right for all columns"}
      </p>
      {modal && <TaskModal task={modal} team={team} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
    </div>
  );
}
