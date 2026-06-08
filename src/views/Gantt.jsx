import { B, fmtDate, ganttDays, ganttOffset, ganttWidth } from "../constants.js";
import { SecHead, Badge, Card } from "../components/primitives.jsx";

export function Gantt({ tasks, buckets, isMobile }){
  if (tasks.length === 0){
    return (
      <div>
        <SecHead title="Gantt Chart" sub="Timeline view of all tasks" />
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
          <div style={{ fontSize:14, color:B.tg }}>No tasks with dates yet. Add tasks and set start/end dates to see the Gantt chart.</div>
        </Card>
      </div>
    );
  }

  const datedTasks = tasks.filter(t => t.start && t.end);
  if (datedTasks.length === 0){
    return (
      <div>
        <SecHead title="Gantt Chart" sub="Timeline view" />
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:14, color:B.tg }}>Tasks exist but none have dates set yet. The admin can set start/end dates on each task.</div>
        </Card>
      </div>
    );
  }

  const { start: gStart, count: gCount } = ganttDays(datedTasks);

  const dayHeaders = Array.from({ length:gCount }, (_, i) => {
    const d   = new Date(gStart);
    d.setDate(d.getDate() + i);
    const isW = d.getDay()===0 || d.getDay()===6;
    return { d, isW, lbl: d.getDate().toString(), month: d.toLocaleString("en-GB",{month:"short"}) };
  });

  function barColor(t){
    if (t.status === "Complete")    return B.dk;
    if (t.status === "In Progress") return B.ac;
    const bkt = buckets.find(b => b.id===t.bucketId);
    return bkt?.color || B.md;
  }

  if (isMobile){
    return (
      <div>
        <SecHead title="Gantt / Timeline" sub="Task dates overview" />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {datedTasks.map(t => {
            const bkt = buckets.find(b => b.id===t.bucketId);
            const go  = ganttOffset(gStart, t.start);
            const gw  = ganttWidth(gStart, t.start, t.end);
            const pctL= Math.min(85, Math.round((go/gCount)*100));
            const pctW= Math.max(3,  Math.round((gw/gCount)*100));
            return (
              <div key={t.id} style={{ background:B.wh, borderRadius:12, border:`1px solid ${B.pl}`, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:10, color:B.tg }}>#{t.id}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:500, color:B.tx }}>{t.desc}</span>
                  <Badge label={t.status} small />
                </div>
                {bkt && <div style={{ fontSize:10, color:bkt.color, fontWeight:600, marginBottom:5 }}>{bkt.name}</div>}
                <div style={{ fontSize:10, color:B.tg, marginBottom:6 }}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
                <div style={{ height:8, borderRadius:99, background:B.st, overflow:"hidden", position:"relative" }}>
                  <div style={{ position:"absolute", left:`${pctL}%`, width:`${pctW}%`,
                    height:"100%", background:barColor(t), borderRadius:99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SecHead title="Gantt Chart" sub={`${gCount}-day view · ${gStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} onwards`} />
      <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${B.pl}` }}>
        <table style={{ borderCollapse:"collapse", minWidth:900, width:"100%", tableLayout:"fixed" }}>
          <colgroup>
            <col style={{ width:28 }} />
            <col style={{ width:200 }} />
            {dayHeaders.map((_,i) => <col key={i} style={{ width:`${580/gCount}px` }} />)}
          </colgroup>
          <thead>
            <tr style={{ background:B.dk }}>
              <th colSpan={2} style={{ padding:"8px 12px", textAlign:"left", color:B.pl, fontSize:10, fontWeight:700 }}>Task</th>
              <th colSpan={gCount} style={{ padding:"8px 6px", textAlign:"center", color:B.lt, fontSize:10, fontWeight:700 }}>Timeline</th>
            </tr>
            <tr style={{ background:B.dk }}>
              {["#","Task"].map(h => (
                <th key={h} style={{ padding:"5px 10px", color:B.pl, fontSize:10, fontWeight:700, textAlign:"left" }}>{h}</th>
              ))}
              {dayHeaders.map((d,i) => (
                <th key={i} style={{ padding:"3px 1px", textAlign:"center", fontSize:7, fontWeight:600,
                  color:d.isW?"rgba(116,198,157,.6)":B.pl, background:d.isW?"rgba(0,0,0,.15)":B.dk }}>
                  {d.lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datedTasks.map((t, ri) => {
              const go  = ganttOffset(gStart, t.start);
              const gw  = ganttWidth(gStart, t.start, t.end);
              const bc  = barColor(t);
              const bg  = ri%2===0 ? B.wh : B.st;
              return (
                <tr key={t.id} style={{ background:bg }}>
                  <td style={{ padding:"5px 8px", fontSize:10, color:B.tg, fontWeight:600 }}>{t.id}</td>
                  <td style={{ padding:"5px 10px" }}>
                    <div style={{ fontSize:11, color:B.tx, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.desc}</div>
                    <div style={{ fontSize:9, color:B.tg }}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
                  </td>
                  {dayHeaders.map((_, di) => {
                    const inBar   = di >= go && di < go + gw;
                    const isStart = inBar && di === go;
                    const isEnd   = inBar && di === go + gw - 1;
                    return (
                      <td key={di} style={{
                        background: inBar ? bc : dayHeaders[di].isW ? "rgba(116,198,157,.07)" : "transparent",
                        borderRadius: isStart ? "4px 0 0 4px" : isEnd ? "0 4px 4px 0" : undefined,
                        height:28,
                      }} />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap" }}>
        {[["Not Started",B.md],["In Progress",B.ac],["Complete",B.dk],["Weekend","rgba(116,198,157,.15)"]].map(([l,c]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:14, height:9, borderRadius:2, background:c, border:"1px solid rgba(0,0,0,.1)" }} />
            <span style={{ fontSize:10, color:B.tg }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
