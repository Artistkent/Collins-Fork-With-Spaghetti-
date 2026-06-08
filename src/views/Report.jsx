import { B, calcPct, fmtDate } from "../constants.js";
import { Card, SecHead, Badge, Pbar } from "../components/primitives.jsx";

export function Report({ tasks, buckets, raci, projectName, brief }){
  const done = tasks.filter(t => t.status==="Complete");
  const outp = tasks.filter(t => t.status!=="Complete");
  const pct  = calcPct(tasks);

  const bucketStats = buckets.map(b => {
    const bt = tasks.filter(t => t.bucketId===b.id);
    return { ...b, tasks:bt, pct:calcPct(bt), done:bt.filter(t=>t.status==="Complete").length };
  });

  return (
    <div>
      <SecHead title="Project Report" sub="Auto-generated from live task data" />

      {/* Summary */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>📊 Summary</div>
        {[
          ["Project",        projectName || "—"],
          ["Total Tasks",    tasks.length],
          ["Complete",       done.length],
          ["In Progress",    tasks.filter(t=>t.status==="In Progress").length],
          ["Not Started",    tasks.filter(t=>t.status==="Not Started").length],
          ["Overall Progress",`${pct}%`],
          ["Buckets",        buckets.length],
        ].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
            borderBottom:`1px solid ${B.st}` }}>
            <span style={{ fontSize:12, color:B.tg }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:600, color:B.tx }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:600, color:B.dk }}>Completion</span>
            <span style={{ fontSize:12, fontWeight:700, color:B.md }}>{pct}%</span>
          </div>
          <Pbar pct={pct} h={10} done={pct===100} />
        </div>
      </Card>

      {/* Brief */}
      {brief?.trim() && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:10 }}>📄 Project Brief</div>
          <div style={{ fontSize:13, color:B.tm, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{brief}</div>
        </Card>
      )}

      {/* Bucket breakdown */}
      {bucketStats.length > 0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:14 }}>🪣 Bucket Progress</div>
          {bucketStats.map(b => (
            <div key={b.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${B.st}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:b.color }} />
                  <span style={{ fontWeight:700, fontSize:13, color:B.dk }}>{b.name}</span>
                </div>
                <span style={{ fontSize:11, color:B.tg }}>{b.done}/{b.tasks.length} tasks · {b.pct}%</span>
              </div>
              <Pbar pct={b.pct} h={5} done={b.pct===100} />
            </div>
          ))}
        </Card>
      )}

      {/* Completed tasks */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>
          ✅ Completed Tasks ({done.length}/{tasks.length})
        </div>
        {done.length === 0 ? (
          <div style={{ fontSize:12, color:B.tg, textAlign:"center", padding:16 }}>No tasks marked complete yet.</div>
        ) : done.map(t => {
          const bkt = buckets.find(b => b.id===t.bucketId);
          return (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
              borderBottom:`1px solid ${B.st}` }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"#C6EFCE",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, color:"#1A5C2A", fontWeight:700 }}>✓</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:"#1A5C2A", fontWeight:600 }}>{t.desc}</div>
                {bkt && <div style={{ fontSize:10, color:bkt.color }}>{bkt.name}</div>}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Outstanding tasks */}
      {outp.length > 0 && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:B.dk, marginBottom:12 }}>
            ⏳ Outstanding ({outp.length})
          </div>
          {outp.map(t => {
            const bkt = buckets.find(b => b.id===t.bucketId);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                borderBottom:`1px solid ${B.st}` }}>
                <Badge label={t.status} small />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:B.tx }}>{t.desc}</div>
                  {bkt && <div style={{ fontSize:10, color:bkt.color }}>{bkt.name}</div>}
                </div>
                <span style={{ fontSize:10, color:B.tg }}>{fmtDate(t.end)}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
