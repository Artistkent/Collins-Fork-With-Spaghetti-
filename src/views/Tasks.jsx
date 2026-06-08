import { useState } from "react";
import { B, fmtDate } from "../constants.js";
import { Card, SecHead, Badge, PriBadge, Pbar, Btn, Inp, Sel } from "../components/primitives.jsx";

const STATUSES  = ["Not Started","In Progress","Complete"];
const PRIORITIES = ["Low","Medium","High","Critical"];

// ── Task card (shown to all users) ────────────────────────────────────────────
function TaskCard({ task, buckets, isAdmin, myBucketId, onClick }){
  const bucket = buckets.find(b => b.id === task.bucketId);
  const canEdit = isAdmin || task.bucketId === myBucketId;
  return (
    <div onClick={() => canEdit && onClick(task)}
      style={{ background:B.wh, borderRadius:14, border:`1px solid ${B.pl}`,
        padding:"14px 16px", cursor:canEdit?"pointer":"default",
        borderLeft:`4px solid ${task.pri==="Critical"?B.dk:task.pri==="High"?B.ac:"transparent"}`,
        opacity:canEdit?1:.75 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
        <span style={{ fontSize:11, color:B.tg, fontWeight:600, minWidth:24, paddingTop:2 }}>#{task.id}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:B.tx, lineHeight:1.3, marginBottom:3 }}>{task.desc}</div>
          {task.notes && <div style={{ fontSize:11, color:B.tg, lineHeight:1.4 }}>{task.notes}</div>}
        </div>
        {canEdit && <span style={{ color:B.ac, fontSize:18, flexShrink:0 }}>›</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
        {bucket && (
          <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
            background:bucket.color+"22", color:bucket.color, fontWeight:700, border:`1px solid ${bucket.color}44` }}>
            {bucket.name}
          </span>
        )}
        <span style={{ fontSize:11, color:B.tg }}>{fmtDate(task.start)} → {fmtDate(task.end)}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <Badge label={task.status} />
        <PriBadge label={task.pri} />
        <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:"auto" }}>
          <Pbar pct={task.pct} done={task.pct===100} />
          <span style={{ fontSize:11, color:B.tg, minWidth:30 }}>{task.pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Task modal (admin: all fields; bucket member: status/pct/notes for own bucket) ──
function TaskModal({ task, buckets, isAdmin, onSave, onDelete, onClose }){
  const isNew = !task.id;
  const [f, setF] = useState({
    desc:     task.desc     || "",
    bucketId: task.bucketId || (buckets[0]?.id || ""),
    start:    task.start    || "",
    end:      task.end      || "",
    status:   task.status   || "Not Started",
    pri:      task.pri      || "Medium",
    pct:      task.pct      ?? 0,
    notes:    task.notes    || "",
  });
  const upd = (k, v) => setF(x => ({ ...x, [k]:v }));

  function submit(){
    if (!f.desc.trim()){ alert("Task description is required."); return; }
    const pct = f.status === "Complete" ? 100 : Math.min(100, Math.max(0, parseInt(f.pct)||0));
    onSave({ ...task, ...f, pct, updatedAt:Date.now() });
  }

  const fi = { width:"100%", padding:"10px 12px", border:`1.5px solid ${B.pl}`, borderRadius:9,
    fontSize:13, color:B.tx, background:B.wh, boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 };

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(26,60,46,.55)", zIndex:500,
        display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:B.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px",
        width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, borderRadius:99, background:"#ddd", margin:"0 auto 18px" }} />
        <h3 style={{ fontSize:16, fontWeight:700, color:B.dk, margin:"0 0 18px" }}>
          {isNew ? "+ New Task" : `Edit Task #${task.id}`}
        </h3>

        {/* Description — admin only for new; all for existing (desc read-only for members) */}
        {(isAdmin || isNew) && (
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Description</label>
            <input style={fi} value={f.desc} onChange={e => upd("desc",e.target.value)} placeholder="What needs to be done?" />
          </div>
        )}
        {!isAdmin && !isNew && (
          <div style={{ marginBottom:14, padding:"10px 12px", background:B.st, borderRadius:9, fontSize:13, color:B.tm }}>
            <b style={{ color:B.dk }}>#{task.id}</b> {task.desc}
          </div>
        )}

        {/* Bucket — admin only */}
        {isAdmin && (
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Authority Bucket</label>
            <select style={fi} value={f.bucketId} onChange={e => upd("bucketId",e.target.value)}>
              <option value="">— Unassigned —</option>
              {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Dates — admin only */}
        {isAdmin && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={lbl}>Start Date</label>
              <input style={fi} type="date" value={f.start} onChange={e => upd("start",e.target.value)} />
            </div>
            <div>
              <label style={lbl}>End Date</label>
              <input style={fi} type="date" value={f.end} onChange={e => upd("end",e.target.value)} />
            </div>
          </div>
        )}

        {/* Priority — admin only */}
        {isAdmin && (
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Priority</label>
            <select style={fi} value={f.pri} onChange={e => upd("pri",e.target.value)}>
              {["Low","Medium","High","Critical"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Status & pct — everyone */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={lbl}>Status</label>
            <select style={fi} value={f.status} onChange={e => upd("status",e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>% Done</label>
            <input style={fi} type="number" min={0} max={100}
              value={f.pct} onChange={e => upd("pct",e.target.value)} />
          </div>
        </div>

        {/* Notes — everyone */}
        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...fi, height:72, resize:"vertical" }}
            value={f.notes} onChange={e => upd("notes",e.target.value)} placeholder="Any notes…" />
        </div>

        <Btn onClick={submit} style={{ width:"100%", marginBottom:10 }}>
          {isNew ? "Add Task" : "Save Changes"}
        </Btn>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onClose} variant="ghost" style={{ flex:1 }}>Cancel</Btn>
          {isAdmin && !isNew && (
            <Btn onClick={() => onDelete(task.id)} variant="danger" style={{ flex:1 }}>Delete</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tasks view ────────────────────────────────────────────────────────────────
export function Tasks({ tasks, setTasks, buckets, isAdmin, myBucketId, projectCode, setToast }){
  const [modal,  setModal]  = useState(null);
  const [filter, setFilter] = useState("All");

  const visible = filter === "All" ? tasks : tasks.filter(t => t.status === filter);

  async function handleSave(saved){
    const isNew = !saved.id;
    const payload = isNew
      ? { ...saved, id: tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 1 }
      : saved;

    if (isNew) setTasks(ts => [...ts, payload]);
    else       setTasks(ts => ts.map(t => t.id===payload.id ? payload : t));

    setModal(null);
    setToast(isNew ? "✓ Task added" : `✓ Task #${payload.id} updated`);

    // Persist to DB
    try {
      await fetch("/api/update-task", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...payload, project_code:projectCode }),
      });
    } catch { /* optimistic update already applied */ }
  }

  async function handleDelete(id){
    if (!window.confirm(`Delete task #${id}?`)) return;
    setTasks(ts => ts.filter(t => t.id !== id));
    setModal(null);
    setToast("Task deleted");
    try {
      await fetch("/api/delete-task", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, project_code:projectCode }),
      });
    } catch { /* optimistic */ }
  }

  const blankTask = { desc:"", bucketId:buckets[0]?.id||"", start:"", end:"", status:"Not Started", pri:"Medium", pct:0, notes:"" };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:10 }}>
        <SecHead title="Tasks" sub="All project tasks · only your bucket tasks are editable" />
        {isAdmin && (
          <Btn onClick={() => setModal(blankTask)} style={{ flexShrink:0 }}>+ Add Task</Btn>
        )}
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {["All","Complete","In Progress","Not Started"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${filter===s?B.ac:B.pl}`,
              background:filter===s?B.pl:"transparent", color:filter===s?B.md:B.tg,
              fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {visible.map(t => (
          <TaskCard key={t.id} task={t} buckets={buckets}
            isAdmin={isAdmin} myBucketId={myBucketId}
            onClick={() => setModal(t)} />
        ))}
        {visible.length === 0 && (
          <Card style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
            <div style={{ fontSize:14, color:B.tg }}>No tasks found.</div>
          </Card>
        )}
      </div>

      {modal !== null && (
        <TaskModal
          task={modal} buckets={buckets}
          isAdmin={isAdmin}
          onSave={handleSave} onDelete={handleDelete} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
