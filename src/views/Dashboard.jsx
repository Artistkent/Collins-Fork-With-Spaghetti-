import { B, calcPct, fmtDate, initials } from "../constants.js";
import { Card, SecHead, Pbar, Badge, Avatar } from "../components/primitives.jsx";

export function Dashboard({ tasks, buckets, projectName, auth, onNav }){
  const done = tasks.filter(t => t.status==="Complete").length;
  const inp  = tasks.filter(t => t.status==="In Progress").length;
  const ns   = tasks.filter(t => t.status==="Not Started").length;
  const pct  = calcPct(tasks);

  // For bucket members: show tasks in their bucket
  const myTasks = auth.role==="bucket"
    ? tasks.filter(t => auth.bucketTaskIds?.includes(t.id))
    : tasks;

  // Bucket breakdown for admin
  const bucketStats = buckets.map(b => {
    const bt  = tasks.filter(t => t.bucketId === b.id);
    const bpc = calcPct(bt);
    // Members who have logged in via this bucket
    const members = b.members || [];
    return { ...b, taskCount:bt.length, pct:bpc, members };
  });

  const urgent = tasks
    .filter(t => t.status!=="Complete" && (t.pri==="Critical" || t.pri==="High"))
    .slice(0, 6);

  return (
    <div>
      <SecHead title={projectName || "Dashboard"} sub="Live project progress" />

      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        {[
          { l:"Progress",    v:`${pct}%`,  c:B.md },
          { l:"Complete",    v:done,        c:"#1A5C2A" },
          { l:"In Progress", v:inp,         c:"#7A5000" },
          { l:"Not Started", v:ns,          c:"#8B1A1A" },
        ].map((k,i) => (
          <Card key={i} style={{ padding:"12px 14px" }}>
            <div style={{ fontSize:9, color:B.tg, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:5 }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* Overall bar */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontWeight:700, fontSize:13, color:B.dk }}>Overall Completion</span>
          <span style={{ fontWeight:700, color:B.md }}>{pct}%</span>
        </div>
        <Pbar pct={pct} h={12} done={pct===100} />
      </Card>

      {/* Bucket member: my tasks */}
      {auth.role === "bucket" && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>
            🪣 {auth.bucketName} — Your Tasks
          </div>
          {myTasks.length === 0 ? (
            <div style={{ fontSize:12, color:B.tg, textAlign:"center", padding:12 }}>No tasks assigned to your bucket yet.</div>
          ) : myTasks.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
              borderBottom:`1px solid ${B.st}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:B.tx }}>{t.desc}</div>
                <div style={{ fontSize:10, color:B.tg, marginTop:2 }}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
              </div>
              <Badge label={t.status} small />
            </div>
          ))}
        </Card>
      )}

      {/* Admin: bucket breakdown */}
      {auth.role === "admin" && buckets.length > 0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:14 }}>🪣 Authority Buckets</div>
          {bucketStats.map(b => (
            <div key={b.id} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${B.st}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:b.color }} />
                  <span style={{ fontWeight:700, fontSize:13, color:B.dk }}>{b.name}</span>
                  <code style={{ fontSize:10, padding:"1px 7px", borderRadius:20,
                    background:b.color+"18", color:b.color, fontWeight:700 }}>{b.code}</code>
                </div>
                <span style={{ fontSize:11, color:B.tg }}>{b.taskCount} tasks · {b.pct}%</span>
              </div>
              <Pbar pct={b.pct} h={5} />
              {b.members.length > 0 && (
                <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                  {b.members.map(m => (
                    <span key={m} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                      background:B.st, color:B.tm }}>👤 {m}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Urgent tasks */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>🔴 High Priority Outstanding</div>
        {urgent.length === 0 ? (
          <div style={{ fontSize:13, color:"#1A5C2A", textAlign:"center", padding:16 }}>🎉 All high priority tasks done!</div>
        ) : urgent.map(t => {
          const bkt = buckets.find(b => b.id===t.bucketId);
          return (
            <div key={t.id} onClick={() => onNav("tasks")}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0",
                borderBottom:`1px solid ${B.st}`, cursor:"pointer" }}>
              <div style={{ width:7, height:7, borderRadius:"50%",
                background:t.pri==="Critical"?B.dk:B.ac, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, lineHeight:1.3 }}>{t.desc}</div>
                {bkt && <div style={{ fontSize:10, color:bkt.color, fontWeight:600 }}>{bkt.name}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                <Badge label={t.status} small />
                <span style={{ fontSize:10, color:B.tg }}>{fmtDate(t.end)}</span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
