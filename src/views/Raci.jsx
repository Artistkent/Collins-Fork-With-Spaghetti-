import { B, RACI_CYCLE, RACI_STYLE, fmtDate } from "../constants.js";
import { SecHead, Badge } from "../components/primitives.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// RACI Matrix
//
// Columns = one column per bucket (not per person)
// Rows    = tasks
// Access:
//   admin  → can cycle any cell
//   bucket → can only cycle cells in their bucket column for tasks in their bucket
//
// When a bucket member logs in with a name, that name is stored in bucket.members.
// The RACI value is stored as raci[taskId][bucketId] = "R"|"A"|"C"|"I"|""
// ─────────────────────────────────────────────────────────────────────────────
export function Raci({ tasks, buckets, raci, setRaci, auth, setToast, isMobile }){
  const isAdmin      = auth.role === "admin";
  const myBucketId   = auth.bucketId || null;
  const myBucketTids = auth.bucketTaskIds || [];

  function canEdit(taskId, bucketId){
    if (isAdmin) return true;
    // Bucket member: can only edit their own bucket column, and only on tasks in their bucket
    return bucketId === myBucketId && myBucketTids.includes(taskId);
  }

  function cycle(taskId, bucketId){
    if (!canEdit(taskId, bucketId)) return;
    setRaci(prev => {
      const row = prev[taskId] || {};
      const cur = row[bucketId] || "";
      const nxt = RACI_CYCLE[(RACI_CYCLE.indexOf(cur) + 1) % RACI_CYCLE.length];
      return { ...prev, [taskId]:{ ...row, [bucketId]:nxt } };
    });
    setToast("RACI updated");
  }

  if (buckets.length === 0){
    return (
      <div>
        <SecHead title="RACI Matrix" sub="Responsibility assignment matrix" />
        <div style={{ background:B.st, border:`1px solid ${B.pl}`, borderRadius:12,
          padding:40, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🪣</div>
          <div style={{ fontSize:14, color:B.dk, fontWeight:600, marginBottom:6 }}>No authority buckets yet</div>
          <div style={{ fontSize:12, color:B.tg }}>
            {isAdmin ? "Create authority buckets in the Buckets tab — each bucket becomes a column here." : "The admin hasn't set up any buckets yet."}
          </div>
        </div>
      </div>
    );
  }

  // Only show tasks relevant to the viewer
  const visibleTasks = isAdmin ? tasks : tasks.filter(t => myBucketTids.includes(t.id));

  return (
    <div>
      <SecHead
        title="RACI Matrix"
        sub={isAdmin
          ? "Tap any cell to cycle R→A→C→I→blank. Columns = authority buckets."
          : `Showing your bucket's tasks. You can only update the "${auth.bucketName}" column.`}
      />

      {!isAdmin && (
        <div style={{ background:"#EBF7EE", border:`1px solid ${B.lt}`, borderRadius:10,
          padding:"10px 16px", marginBottom:14, fontSize:12, color:B.md }}>
          ℹ️ You can update RACI cells in the <b>{auth.bucketName}</b> column for your assigned tasks.
          All other cells are read-only.
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[["R","Responsible","#1A3C2E","#fff"],["A","Accountable","#40916C","#fff"],["C","Consulted","#D8F3DC","#1A3C2E"],["I","Informed","#e4e4e4","#555"]].map(([v,l,bg,fg]) => (
          <div key={v} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
            background:B.wh, borderRadius:10, border:`1px solid ${B.pl}` }}>
            <div style={{ width:24, height:24, borderRadius:6, background:bg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700, color:fg }}>{v}</div>
            <span style={{ fontSize:11, color:B.dk, fontWeight:600 }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX:"auto", background:B.wh, borderRadius:12, border:`1px solid ${B.pl}` }}>
        <table style={{ borderCollapse:"collapse", minWidth:isMobile?500:700, width:"100%" }}>
          <thead>
            <tr style={{ background:B.dk }}>
              <th style={{ padding:"10px 8px", textAlign:"left", color:B.pl, fontSize:10, fontWeight:700,
                width:28, position:"sticky", left:0, background:B.dk, zIndex:2 }}>#</th>
              <th style={{ padding:"10px 10px", textAlign:"left", color:B.pl, fontSize:10, fontWeight:700,
                minWidth:isMobile?120:180, position:"sticky", left:28, background:B.dk, zIndex:2 }}>Task</th>
              <th style={{ padding:"10px 8px", textAlign:"center", color:B.pl, fontSize:10, fontWeight:700, width:80 }}>Status</th>
              {buckets.map(b => (
                <th key={b.id} style={{ padding:"8px 6px", textAlign:"center", color:"#fff", fontSize:10, fontWeight:700, minWidth:80 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:b.color, margin:"0 auto 3px" }} />
                  {b.name}
                  <div style={{ fontSize:8, color:"rgba(255,255,255,.6)", marginTop:1 }}>{b.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((t, ri) => {
              const row    = raci[t.id] || {};
              const isDone = t.status === "Complete";
              const bg     = isDone ? "#f0fdf4" : ri%2===0 ? B.wh : B.st;
              return (
                <tr key={t.id} style={{ background:bg }}>
                  <td style={{ padding:"8px 8px", fontSize:10, color:B.tg, fontWeight:600,
                    position:"sticky", left:0, background:bg, zIndex:1 }}>{t.id}</td>
                  <td style={{ padding:"8px 10px", position:"sticky", left:28, background:bg, zIndex:1 }}>
                    <div style={{ fontSize:11, color:isDone?"#1A5C2A":B.tx, fontWeight:isDone?700:400, lineHeight:1.3 }}>
                      {isDone && "✅ "}{t.desc}
                    </div>
                    <div style={{ fontSize:9, color:B.tg, marginTop:1 }}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
                  </td>
                  <td style={{ padding:"5px 6px", textAlign:"center" }}>
                    <Badge label={t.status} small />
                  </td>
                  {buckets.map(b => {
                    const val  = row[b.id] || "";
                    const rs   = RACI_STYLE[val] || RACI_STYLE[""];
                    const edit = canEdit(t.id, b.id);
                    return (
                      <td key={b.id} style={{ padding:"5px 5px", textAlign:"center" }}>
                        <div
                          onClick={() => cycle(t.id, b.id)}
                          title={edit ? `${b.name}: ${val||"—"}` : "Read-only"}
                          style={{ width:36, height:36, borderRadius:8, margin:"0 auto",
                            background:rs.bg, color:rs.fg,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:13, fontWeight:700,
                            cursor:edit?"pointer":"default",
                            border:val?"none":"1.5px dashed #ddd",
                            opacity:edit?1:.35,
                            userSelect:"none",
                            transition:"transform .1s",
                          }}
                          onMouseEnter={e => { if(edit) e.currentTarget.style.transform="scale(1.12)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}>
                          {val || "+"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {visibleTasks.length === 0 && (
              <tr>
                <td colSpan={3 + buckets.length} style={{ textAlign:"center", padding:32, color:B.tg, fontSize:13 }}>
                  No tasks to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:11, color:B.tg, marginTop:8 }}>
        {isAdmin ? "Tap any cell to cycle through R→A→C→I→blank. Save to persist." : "Greyed cells are read-only."}
      </p>
    </div>
  );
}
