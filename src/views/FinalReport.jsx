import { B, calcPct, fmtDate, memberObj } from "../constants.js";
import { Card, SecHead, Avatar, Badge, Pbar } from "../components/primitives.jsx";

export function FinalReport({ tasks, team, raci, isMobile }){
  const done    = tasks.filter(t=>t.status==="Complete");
  const inp     = tasks.filter(t=>t.status==="In Progress");
  const ns      = tasks.filter(t=>t.status==="Not Started");
  const pct     = calcPct(tasks);
  const allDone = tasks.length>0 && done.length===tasks.length;

  const memberSummary = team.map(m => {
    const myTasks    = tasks.filter(t=>t.owner===m.id);
    const myDone     = myTasks.filter(t=>t.status==="Complete");
    const myRaci     = tasks.map(t=>{ const r=(raci[t.id]||{})[m.id]; return r?{task:t,role:r}:null; }).filter(Boolean);
    const accountable= myRaci.filter(x=>x.role==="A"||x.role==="R");
    return { ...m, myTasks, myDone, accountable, completion:myTasks.length?Math.round(myDone.length/myTasks.length*100):0 };
  });

  const postEventTasks   = [18,19];
  const criticalOutstanding = tasks.filter(t=>t.status!=="Complete"&&t.pri==="Critical");

  return (
    <div>
      <SecHead title="Project Report" sub="Auto-generated from task completion data"/>

      {allDone && (
        <div style={{ background:"#C6EFCE", border:"1px solid #74C69D", borderRadius:12, padding:"16px 20px", marginBottom:14, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🎉</div>
          <div style={{ fontWeight:700, fontSize:16, color:"#1A5C2A", marginBottom:4 }}>All Tasks Complete!</div>
          <div style={{ fontSize:12, color:B.md }}>The Oxford Debate 2026 project has been delivered successfully.</div>
        </div>
      )}

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>📊 Project Summary</div>
        {[
          ["Project","Oxford-Style Debate · 28 April 2026"],
          ["Venue","NSU Building – Reds Hall"],
          ["Overall Progress",`${pct}%`],
          ["Total Tasks",tasks.length],
          ["Complete",done.length],
          ["In Progress",inp.length],
          ["Not Started",ns.length],
          ["Critical Outstanding",criticalOutstanding.length],
        ].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${B.st}` }}>
            <span style={{ fontSize:12, color:B.tg }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:600, color:typeof v==="number"&&v===done.length&&done.length>0?"#1A5C2A":B.tx }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>✅ Completed Tasks ({done.length}/{tasks.length})</div>
        {done.length===0
          ? <div style={{ fontSize:12, color:B.tg, textAlign:"center", padding:16 }}>No tasks marked complete yet. Tick ✓ on the RACI tab to mark tasks done.</div>
          : done.map(t => {
            const m = memberObj(t.owner, team);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${B.st}` }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"#C6EFCE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:12, color:"#1A5C2A", fontWeight:700 }}>✓</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#1A5C2A", fontWeight:600 }}>{t.desc}</div>
                  {t.notes && <div style={{ fontSize:10, color:B.tg, marginTop:1 }}>{t.notes}</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <Avatar name={m.name} area={m.area} size={20}/>
                  <span style={{ fontSize:10, color:B.tg }}>{m.name.split(" ")[0]}</span>
                </div>
              </div>
            );
          })
        }
      </Card>

      {(inp.length>0||ns.length>0) && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>⏳ Outstanding Tasks ({inp.length+ns.length})</div>
          {[...inp,...ns].map(t => {
            const m = memberObj(t.owner, team);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${B.st}` }}>
                <Badge label={t.status} small/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:B.tx, fontWeight:500 }}>{t.desc}</div>
                  <div style={{ fontSize:10, color:B.tg, marginTop:1 }}>{fmtDate(t.end)}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <Avatar name={m.name} area={m.area} size={20}/>
                  <span style={{ fontSize:10, color:B.tg }}>{m.name.split(" ")[0]}</span>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:14 }}>👥 Team Completion Summary</div>
        {memberSummary.map(m => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${B.st}` }}>
            <Avatar name={m.name} area={m.area} size={36}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:600, color:B.dk }}>{m.name.split(" ")[0]}</span>
                <span style={{ fontSize:11, color:m.completion===100?"#1A5C2A":B.tg, fontWeight:600 }}>{m.myDone.length}/{m.myTasks.length} tasks · {m.completion}%</span>
              </div>
              <Pbar pct={m.completion} h={5} done={m.completion===100}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
