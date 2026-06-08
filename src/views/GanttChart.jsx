import { useState } from "react";
import { B, fmtDate, memberObj, GANTT_START, GANTT_DAYS, ganttOffset, ganttWidth } from "../constants.js";
import { SecHead, Avatar, Badge } from "../components/primitives.jsx";
import { TaskModal } from "../components/TaskModal.jsx";

export function GanttChart({ tasks, setTasks, team, setToast, isMobile }){
  const [modal, setModal] = useState(null);

  function handleSave(saved){
    setTasks(ts=>ts.map(t=>t.id===saved.id?{...saved,updatedAt:Date.now()}:t));
    setModal(null);
    setToast(`✓ Task #${saved.id} updated — RACI synced`);
  }
  function handleDelete(id){
    setTasks(ts=>ts.filter(t=>t.id!==id));
    setModal(null);
    setToast("Task deleted");
  }

  const barCol = t => t.id===17?"#FFD700":t.status==="Complete"?B.dk:t.status==="In Progress"?B.ac:B.md;

  if (isMobile){
    return (
      <div>
        <SecHead title="Gantt / Timeline" sub="Tap a task to edit dates & status"/>
        <div style={{ background:"#FFF3CD", border:"1px solid #F0C040", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#7A5000" }}>
          🔗 Editing here syncs to RACI and Dashboard.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {tasks.map(t => {
            const m    = memberObj(t.owner, team);
            const bc   = barCol(t);
            const isMile = t.id===17;
            const gl   = ganttOffset(t.start);
            const gw   = ganttWidth(t.start,t.end);
            const barPct  = Math.min(100, Math.round((gw/GANTT_DAYS)*100));
            const barLeft = Math.min(85,  Math.round((gl/GANTT_DAYS)*100));
            return (
              <div key={t.id} onClick={()=>setModal(t)} style={{ background:B.wh, borderRadius:12, border:`1px solid ${B.pl}`, padding:"12px 14px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:10, color:B.tg, minWidth:20 }}>#{t.id}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:isMile?700:500, color:isMile?B.dk:B.tx }}>{isMile?"⭐ ":""}{t.desc}</span>
                  <Badge label={t.status} small/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <Avatar name={m.name} area={m.area} size={18}/>
                  <span style={{ fontSize:11, color:B.tg }}>{m.name.split(" ")[0]}</span>
                  <span style={{ fontSize:11, color:B.tg, marginLeft:"auto" }}>{fmtDate(t.start)} → {fmtDate(t.end)}</span>
                </div>
                <div style={{ height:8, borderRadius:99, background:B.st, overflow:"hidden", position:"relative" }}>
                  <div style={{ position:"absolute", left:`${barLeft}%`, width:`${Math.max(4,barPct)}%`, height:"100%", background:bc, borderRadius:99 }}/>
                </div>
              </div>
            );
          })}
        </div>
        {modal && <TaskModal task={modal} team={team} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
      </div>
    );
  }

  const days = Array.from({ length:GANTT_DAYS }, (_,i) => {
    const d = new Date("2026-04-06T12:00:00");
    d.setDate(d.getDate()+i);
    const isW    = d.getDay()===0||d.getDay()===6;
    const isMile = i===22;
    return { i, isW, isMile, lbl: isMile?"28⭐":d.getMonth()===4?`${d.getDate()}/5`:String(d.getDate()) };
  });

  return (
    <div>
      <SecHead title="Gantt Chart" sub="6 April – 8 May 2026 · ⭐ = Event Day · Click task name to edit — syncs to RACI"/>
      <div style={{ background:"#FFF3CD", border:"1px solid #F0C040", borderRadius:10, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#7A5000", display:"flex", alignItems:"center", gap:8 }}>
        🔗 <span>Editing any task here automatically updates the <b>RACI matrix</b>, <b>Dashboard</b> and <b>Final Report</b>.</span>
      </div>
      <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${B.pl}` }}>
        <table style={{ borderCollapse:"collapse", minWidth:900, width:"100%", tableLayout:"fixed" }}>
          <colgroup>
            <col style={{ width:28 }}/><col style={{ width:200 }}/><col style={{ width:80 }}/>
            {days.map((_,i)=><col key={i} style={{ width:`${100/GANTT_DAYS}%` }}/>)}
          </colgroup>
          <thead>
            <tr>
              <th colSpan={3} style={{ background:B.dk, padding:"8px 12px", textAlign:"left", color:B.pl, fontSize:10, fontWeight:700 }}>Task</th>
              <th colSpan={GANTT_DAYS} style={{ background:B.dk, padding:"8px 6px", textAlign:"center", color:B.lt, fontSize:10, fontWeight:700 }}>April 2026 → May 2026</th>
            </tr>
            <tr style={{ background:B.dk }}>
              {["#","Task","Owner"].map(h=><th key={h} style={{ padding:"6px 10px", color:B.pl, fontSize:10, fontWeight:700, textAlign:"left" }}>{h}</th>)}
              {days.map(d=>(
                <th key={d.i} style={{ padding:"4px 1px", textAlign:"center", fontSize:d.isMile?9:8, fontWeight:d.isMile?700:600, color:d.isW?"rgba(116,198,157,.7)":d.isMile?"#FFD700":B.pl, background:d.isW?"rgba(0,0,0,.18)":B.dk, borderLeft:d.isMile?"2px solid rgba(255,215,0,.4)":undefined }}>
                  {d.lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t,ri) => {
              const m = memberObj(t.owner, team);
              const gl = ganttOffset(t.start); const gw = ganttWidth(t.start,t.end);
              const bc = barCol(t); const bg = ri%2===0?B.wh:B.st;
              const isRecent = t.updatedAt&&Date.now()-t.updatedAt<60000;
              return (
                <tr key={t.id} style={{ background:isRecent?"#FFFBEA":bg, outline:isRecent?"2px solid #F0C040":"none" }}>
                  <td style={{ padding:"5px 10px", fontSize:10, color:B.tg, fontWeight:600 }}>{t.id}</td>
                  <td style={{ padding:"5px 10px", cursor:"pointer" }} onClick={()=>setModal(t)}>
                    <div style={{ fontSize:11, fontWeight:t.id===17?700:400, color:t.id===17?B.dk:B.tx, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {isRecent&&<span style={{ fontSize:9, color:"#7A5000", marginRight:4 }}>✦</span>}
                      {t.id===17?"⭐ ":""}{t.desc}
                    </div>
                    <div style={{ fontSize:9, color:B.tg }}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
                  </td>
                  <td style={{ padding:"5px 10px", fontSize:10, color:B.tm, whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</td>
                  {days.map(d => {
                    const inBar=d.i>=gl&&d.i<gl+gw; const isStart=inBar&&d.i===gl; const isEnd=inBar&&d.i===gl+gw-1;
                    return (
                      <td key={d.i} style={{ padding:"4px 1px", height:32, textAlign:"center", background:inBar?bc:d.isW?"rgba(116,198,157,.08)":"transparent", borderLeft:d.isMile?"1px dashed rgba(255,215,0,.35)":undefined, borderRadius:isStart?"4px 0 0 4px":isEnd?"0 4px 4px 0":undefined }}>
                        {inBar&&t.id===17&&d.i===gl&&<span style={{ fontSize:12 }}>⭐</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
        {[["Planned",B.md],["In Progress",B.ac],["Complete",B.dk],["Milestone","#FFD700"],["Weekend","rgba(116,198,157,.15)"],["Just updated","#FFFBEA"]].map(([l,c])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:14, height:9, borderRadius:2, background:c, border:"1px solid rgba(0,0,0,.1)" }}/>
            <span style={{ fontSize:10, color:B.tg }}>{l}</span>
          </div>
        ))}
      </div>
      {modal && <TaskModal task={modal} team={team} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
    </div>
  );
}
