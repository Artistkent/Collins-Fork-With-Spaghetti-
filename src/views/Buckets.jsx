import { useState } from "react";
import { B } from "../constants.js";
import { Card, SecHead, Btn } from "../components/primitives.jsx";

// Predefined palette for bucket colours
const PALETTE = [
  "#1A3C2E","#2D6A4F","#40916C","#52B788","#74C69D",
  "#E76F51","#F4A261","#264653","#2A9D8F","#8338EC",
  "#3A86FF","#FB5607","#FF006E","#FFBE0B","#606C38",
];

function randomCode(name){
  const slug = name.replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(0,4) || "BKT";
  const rand  = Math.random().toString(36).toUpperCase().slice(2,5);
  return `${slug}-${rand}`;
}

// ── Bucket card ───────────────────────────────────────────────────────────────
function BucketCard({ bucket, tasks, onEdit, onDelete }){
  const myTasks = tasks.filter(t => t.bucketId === bucket.id);
  const [copied, setCopied] = useState(false);

  function copyCode(){
    navigator.clipboard.writeText(bucket.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card style={{ borderLeft:`4px solid ${bucket.color}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:B.dk, marginBottom:3 }}>{bucket.name}</div>
          {bucket.desc && <div style={{ fontSize:12, color:B.tg, lineHeight:1.4 }}>{bucket.desc}</div>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={onEdit}
            style={{ padding:"5px 12px", borderRadius:8, background:B.pl, color:B.md,
              fontSize:12, fontWeight:700, border:"none", cursor:"pointer" }}>Edit</button>
          <button onClick={onDelete}
            style={{ padding:"5px 12px", borderRadius:8, background:"#FFE0E0", color:"#8B1A1A",
              fontSize:12, fontWeight:700, border:"none", cursor:"pointer" }}>✕</button>
        </div>
      </div>

      {/* Code chip */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:11, color:B.tg }}>Access code:</span>
        <button onClick={copyCode}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px",
            borderRadius:99, background:bucket.color+"18", border:`1.5px solid ${bucket.color}55`,
            cursor:"pointer" }}>
          <code style={{ fontSize:13, fontWeight:800, color:bucket.color, letterSpacing:1 }}>{bucket.code}</code>
          <span style={{ fontSize:10, color:bucket.color, fontWeight:600 }}>{copied?"Copied!":"Copy"}</span>
        </button>
      </div>

      {/* Assigned tasks */}
      <div style={{ fontSize:11, color:B.tg, marginBottom:myTasks.length?8:0 }}>
        {myTasks.length} task{myTasks.length!==1?"s":""} assigned
      </div>
      {myTasks.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {myTasks.map(t => (
            <span key={t.id} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
              background:B.st, color:B.tm, border:`1px solid ${B.pl}` }}>
              #{t.id} {t.desc.slice(0,28)}{t.desc.length>28?"…":""}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Bucket form (create / edit) ───────────────────────────────────────────────
function BucketForm({ bucket, tasks, allBuckets, onSave, onClose }){
  const isNew = !bucket.id;
  const [name,     setName]     = useState(bucket.name  || "");
  const [desc,     setDesc]     = useState(bucket.desc  || "");
  const [code,     setCode]     = useState(bucket.code  || "");
  const [color,    setColor]    = useState(bucket.color || PALETTE[0]);
  const [taskIds,  setTaskIds]  = useState(bucket.taskIds || []);
  const [err,      setErr]      = useState("");

  function toggleTask(id){
    setTaskIds(ids => ids.includes(id) ? ids.filter(x => x!==id) : [...ids, id]);
  }

  function submit(){
    if (!name.trim()){ setErr("Bucket name is required."); return; }
    const c = code.trim().toUpperCase();
    if (!c)           { setErr("Bucket code is required."); return; }
    // Check code uniqueness (excluding self)
    const clash = allBuckets.find(b => b.code === c && b.id !== bucket.id);
    if (clash){ setErr(`Code "${c}" is already used by "${clash.name}".`); return; }
    onSave({ ...bucket, name:name.trim(), desc:desc.trim(), code:c, color, taskIds });
  }

  const fi = { width:"100%", padding:"10px 12px", border:`1.5px solid ${B.pl}`, borderRadius:9,
    fontSize:13, color:B.tx, background:B.wh, boxSizing:"border-box" };
  const lbl = { fontSize:11, fontWeight:700, color:B.tg, display:"block", marginBottom:4,
    textTransform:"uppercase", letterSpacing:.5 };

  // Tasks not assigned to any bucket, plus tasks already in this bucket
  const available = tasks.filter(t => !t.bucketId || t.bucketId === bucket.id);

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(26,60,46,.55)", zIndex:500,
        display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:B.wh, borderRadius:"18px 18px 0 0", padding:"24px 20px 36px",
        width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, borderRadius:99, background:"#ddd", margin:"0 auto 18px" }} />
        <h3 style={{ fontSize:16, fontWeight:700, color:B.dk, margin:"0 0 18px" }}>
          {isNew ? "Create Authority Bucket" : `Edit: ${bucket.name}`}
        </h3>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Bucket Name</label>
          <input style={fi} value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Design Team" />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Description (optional)</label>
          <input style={fi} value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What is this bucket for?" />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Login Code</label>
          <div style={{ display:"flex", gap:8 }}>
            <input style={{ ...fi, flex:1 }} value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g,""))}
              placeholder="e.g. DESIGN-X4" />
            <button onClick={() => setCode(randomCode(name))}
              style={{ padding:"10px 14px", borderRadius:9, background:B.st, border:`1px solid ${B.pl}`,
                fontSize:12, fontWeight:700, color:B.md, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
              Generate
            </button>
          </div>
          <div style={{ fontSize:10, color:B.tg, marginTop:4 }}>
            Share this code with bucket members so they can log in.
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Colour</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {PALETTE.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:28, height:28, borderRadius:"50%", background:c, border:color===c?"3px solid #fff":"2px solid transparent",
                  boxShadow:color===c?`0 0 0 2px ${c}`:"none", cursor:"pointer" }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Assign Tasks ({taskIds.length} selected)</label>
          {tasks.length === 0 ? (
            <div style={{ fontSize:12, color:B.tg, padding:"10px", background:B.st, borderRadius:9 }}>
              No tasks created yet. Add tasks first, then assign them to buckets.
            </div>
          ) : (
            <div style={{ maxHeight:200, overflowY:"auto", border:`1px solid ${B.pl}`, borderRadius:9 }}>
              {tasks.map(t => {
                const checked   = taskIds.includes(t.id);
                const otherBuck = !checked && t.bucketId && t.bucketId !== bucket.id
                  ? allBuckets.find(b => b.id===t.bucketId) : null;
                return (
                  <div key={t.id}
                    onClick={() => !otherBuck && toggleTask(t.id)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                      borderBottom:`1px solid ${B.st}`, cursor:otherBuck?"not-allowed":"pointer",
                      background:checked?B.pl:"transparent", opacity:otherBuck?.6:1 }}>
                    <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${checked?B.ac:B.pl}`,
                      background:checked?B.ac:"transparent", display:"flex", alignItems:"center",
                      justifyContent:"center", flexShrink:0 }}>
                      {checked && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color:B.tx, flex:1 }}>#{t.id} {t.desc}</span>
                    {otherBuck && (
                      <span style={{ fontSize:10, color:B.tg }}>→ {otherBuck.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {err && (
          <div style={{ color:"#8B1A1A", fontSize:12, padding:"8px 12px", background:"#FFE0E0",
            borderRadius:8, marginBottom:12 }}>{err}</div>
        )}

        <Btn onClick={submit} style={{ width:"100%", marginBottom:10 }}>
          {isNew ? "Create Bucket" : "Save Changes"}
        </Btn>
        <Btn onClick={onClose} variant="ghost" style={{ width:"100%" }}>Cancel</Btn>
      </div>
    </div>
  );
}

// ── Buckets view (admin only) ─────────────────────────────────────────────────
export function Buckets({ tasks, setTasks, buckets, setBuckets, projectCode, setToast }){
  const [formBucket, setFormBucket] = useState(null); // null | {} | existing bucket

  async function saveBucket(updated){
    const isNew = !updated.id;
    const withId = isNew ? { ...updated, id: Date.now().toString() } : updated;

    // Update tasks' bucketId based on taskIds selection
    setTasks(ts => ts.map(t => {
      if (withId.taskIds.includes(t.id)) return { ...t, bucketId:withId.id };
      if (t.bucketId === withId.id && !withId.taskIds.includes(t.id)) return { ...t, bucketId:null };
      return t;
    }));

    const newBuckets = isNew
      ? [...buckets, withId]
      : buckets.map(b => b.id===withId.id ? withId : b);
    setBuckets(newBuckets);
    setFormBucket(null);
    setToast(isNew ? `✓ Bucket "${withId.name}" created` : `✓ Bucket "${withId.name}" updated`);

    // Persist
    try {
      await fetch("/api/buckets", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ projectCode, bucket:withId }),
      });
    } catch { /* optimistic */ }
  }

  async function deleteBucket(bucket){
    if (!window.confirm(`Delete bucket "${bucket.name}"?\nTasks will become unassigned.`)) return;
    // Unassign tasks
    setTasks(ts => ts.map(t => t.bucketId===bucket.id ? { ...t, bucketId:null } : t));
    setBuckets(bs => bs.filter(b => b.id!==bucket.id));
    setToast(`Bucket "${bucket.name}" deleted`);
    try {
      await fetch("/api/buckets", {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ projectCode, bucketId:bucket.id }),
      });
    } catch { /* optimistic */ }
  }

  const blankBucket = { name:"", desc:"", code:"", color:PALETTE[buckets.length % PALETTE.length], taskIds:[] };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <SecHead title="Authority Buckets"
          sub="Group tasks into buckets. Each bucket has a code members use to log in. Members can only write RACI on their bucket's tasks." />
        <Btn onClick={() => setFormBucket(blankBucket)} style={{ flexShrink:0 }}>+ New Bucket</Btn>
      </div>

      {buckets.length === 0 ? (
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🪣</div>
          <div style={{ fontSize:15, fontWeight:700, color:B.dk, marginBottom:8 }}>No buckets yet</div>
          <div style={{ fontSize:13, color:B.tg, marginBottom:20, lineHeight:1.5 }}>
            Create authority buckets to group tasks and give team members scoped access.<br/>
            Each bucket gets a code — share it with the relevant people.
          </div>
          <Btn onClick={() => setFormBucket(blankBucket)}>Create First Bucket</Btn>
        </Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {buckets.map(b => (
            <BucketCard key={b.id} bucket={b} tasks={tasks}
              onEdit={() => setFormBucket({ ...b, taskIds:tasks.filter(t=>t.bucketId===b.id).map(t=>t.id) })}
              onDelete={() => deleteBucket(b)} />
          ))}
        </div>
      )}

      {formBucket !== null && (
        <BucketForm
          bucket={formBucket} tasks={tasks} allBuckets={buckets}
          onSave={saveBucket} onClose={() => setFormBucket(null)} />
      )}
    </div>
  );
}
