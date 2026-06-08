import { useState } from "react";
import { B, fmtDate, memberObj } from "../constants.js";
import { SecHead, Avatar, Badge, PriBadge, Pbar } from "../components/primitives.jsx";
import { TaskModal } from "../components/TaskModal.jsx";

export function TaskTracker({ tasks, setTasks, team, setToast, isMobile }){
  const [modal,  setModal]  = useState(null);
  const [filter, setFilter] = useState("All");

  const visible = filter==="All" ? tasks : tasks.filter(t=>t.status===filter);

  function handleSave(saved){
    if (!saved.id){
      const nid = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 1;
      setTasks(ts=>[...ts,{...saved,id:nid}]);
      setToast("✓ Task added");
    } else {
      setTasks(ts=>ts.map(t=>t.id===saved.id?saved:t));
      setToast(`✓ Task #${saved.id} updated`);
    }
    setModal(null);
  }

  function handleDelete(id){
    if (!window.confirm(`Delete task #${id}?`)) return;
    setTasks(ts=>ts.filter(t=>t.id!==id));
    setModal(null);
    setToast("Task deleted");
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:10 }}>
        <SecHead title="Tasks" sub="Tap any card to edit · changes sync to Gantt & RACI"/>
        <button onClick={()=>setModal({ desc:"", start:"2026-04-06", end:"2026-04-07", status:"Not Started", pri:"High", owner:team[0]?.id||"", pct:0, deps:"", notes:"" })}
          style={{ background:B.dk, color:"#fff", padding:"10px 16px", borderRadius:10, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", flexShrink:0 }}>
          + Add
        </button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {["All","Complete","In Progress","Not Started"].map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${filter===s?B.ac:B.pl}`, background:filter===s?B.pl:"transparent", color:filter===s?B.md:B.tg, fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {visible.map(t => {
          const m = memberObj(t.owner, team);
          const isMile = t.id===17;
          return (
            <div key={t.id} onClick={()=>setModal(t)}
              style={{ background:B.wh, borderRadius:14, border:`1px solid ${t.updatedAt&&Date.now()-t.updatedAt<60000?"#F0C040":B.pl}`, padding:"14px 16px", cursor:"pointer", borderLeft:`4px solid ${t.pri==="Critical"?B.dk:t.pri==="High"?B.ac:"transparent"}` }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:11, color:B.tg, fontWeight:600, minWidth:20, paddingTop:2 }}>#{t.id}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:isMile?700:600, color:isMile?B.dk:B.tx, lineHeight:1.3 }}>{isMile?"⭐ ":""}{t.desc}</div>
                  {t.notes && <div style={{ fontSize:11, color:B.tg, marginTop:3, lineHeight:1.4 }}>{t.notes}</div>}
                </div>
                <span style={{ color:B.ac, fontSize:16, flexShrink:0 }}>›</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <Avatar name={m.name} area={m.area} size={22}/>
                <span style={{ fontSize:12, color:B.tm }}>{m.name.split(" ")[0]}</span>
                <span style={{ fontSize:11, color:B.tg, marginLeft:"auto" }}>{fmtDate(t.start)} → {fmtDate(t.end)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <Badge label={t.status}/>
                <PriBadge label={t.pri}/>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:"auto" }}>
                  <Pbar pct={t.pct} done={t.pct===100}/>
                  <span style={{ fontSize:11, color:B.tg, minWidth:30 }}>{t.pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal!==null && <TaskModal task={modal} team={team} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
    </div>
  );
}
