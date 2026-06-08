import { useState, useEffect, useCallback } from "react";

import { B, ROLE_DEFS, calcPct } from "./constants.js";
import { Toast } from "./components/primitives.jsx";
import { LoginScreen } from "./components/auth/LoginScreen.jsx";
import { Brief }       from "./views/Brief.jsx";
import { Dashboard }   from "./views/Dashboard.jsx";
import { Tasks }       from "./views/Tasks.jsx";
import { Buckets }     from "./views/Buckets.jsx";
import { Gantt }       from "./views/Gantt.jsx";
import { Raci }        from "./views/Raci.jsx";
import { Report }      from "./views/Report.jsx";
import { exportToExcel } from "./utils/exportToExcel.js";

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile(){
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

// ── Tab config ────────────────────────────────────────────────────────────────
// admin sees all tabs including "buckets"
// bucket members see brief, dashboard, tasks, gantt, raci, report
const TABS_ADMIN  = [
  { id:"brief",     icon:"📄", label:"Brief"     },
  { id:"dashboard", icon:"📊", label:"Dashboard"  },
  { id:"tasks",     icon:"✅", label:"Tasks"      },
  { id:"buckets",   icon:"🪣", label:"Buckets"    },
  { id:"gantt",     icon:"📅", label:"Gantt"      },
  { id:"raci",      icon:"🔗", label:"RACI"       },
  { id:"report",    icon:"📋", label:"Report"     },
];
const TABS_MEMBER = [
  { id:"brief",     icon:"📄", label:"Brief"     },
  { id:"dashboard", icon:"📊", label:"Dashboard"  },
  { id:"tasks",     icon:"✅", label:"Tasks"      },
  { id:"gantt",     icon:"📅", label:"Gantt"      },
  { id:"raci",      icon:"🔗", label:"RACI"       },
  { id:"report",    icon:"📋", label:"Report"     },
];

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App(){
  const isMobile = useIsMobile();

  // ── Auth ──────────────────────────────────────────────────────────────────
  // auth = null (logged out) | { role:"admin"|"bucket", projectCode, projectName,
  //              bucketId?, bucketName?, bucketTaskIds?, memberName? }
  const [auth, setAuth] = useState(() => {
    try{
      const saved = localStorage.getItem("auth");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Project data ──────────────────────────────────────────────────────────
  const [brief,   setBrief]   = useState("");
  const [tasks,   setTasks]   = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [raci,    setRaci]    = useState({});

  // ── UI ────────────────────────────────────────────────────────────────────
  const [tab,        setTab]       = useState("brief");
  const [toast,      setToast]     = useState("");
  const [saveStatus, setSaveStatus]= useState("idle"); // idle|saving|saved|error
  const [loadingData,setLoadingData]=useState(false);

  // Clear toast after 3.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Load project data after login ─────────────────────────────────────────
  useEffect(() => {
  if (!auth) return;
  async function load(){
    const cacheKey = `project_data_${auth.projectCode}`;

    // 1. Show cached data immediately
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached){
        const { tasks:ct, raci:cr, buckets:cb, brief:cbr } = JSON.parse(cached);
        if (ct) setTasks(ct);
        if (cr) setRaci(cr);
        if (cb) setBuckets(cb);
        if (cbr) setBrief(cbr);
      }
    } catch { /* bad cache, ignore */ }

    // 2. Fetch fresh data from DB
    setLoadingData(true);
    try {
      const res  = await fetch(`/api/state?project_code=${auth.projectCode}`);
      const data = await res.json();
      let mappedTasks = [];
      if (data.exists && Array.isArray(data.tasks)){
        mappedTasks = data.tasks.map(t => ({
          ...t,
          bucketId: t.bucket_id ?? t.bucketId ?? null,
        }));
        setTasks(mappedTasks);
        if (data.raci) setRaci(data.raci);
      }else{
        setTasks([]);
        setRaci({});
      }

      const bRes  = await fetch(`/api/project?project_code=${auth.projectCode}`);
      const bData = await bRes.json();
      if (bData.project) setBrief(bData.project.brief || "");

      const kRes  = await fetch(`/api/buckets?project_code=${auth.projectCode}`);
      const kData = await kRes.json();
      if (Array.isArray(kData.buckets)) setBuckets(kData.buckets);

      // 3. Update cache with fresh data
      localStorage.setItem(cacheKey, JSON.stringify({
        tasks:   mappedTasks,
        raci:    data.raci || {},
        buckets: kData.buckets || [],
        brief:   bData.project?.brief || "",
      }));

    } catch(e){
      console.error("Load error:", e.message);
      setToast("⚠ Could not reach server — showing cached data");
    } finally {
      setLoadingData(false);
    }
  }
  load();
}, [auth]);

  

  // ── Save (tasks + RACI) ───────────────────────────────────────────────────
  async function saveToServer(){
    setSaveStatus("saving");
    const savedAt = new Date().toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
    try {
      const res = await fetch("/api/state", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          tasks: tasks.map(t => ({ ...t, bucket_id: t.bucketId })),
          raci,
          savedBy: auth.memberName || auth.role,
          savedAt,
          project_code: auth.projectCode,
        }),
      });
      if (!res.ok){ const e = await res.json(); throw new Error(e.error || "Save failed"); }
      setSaveStatus("saved");
      setToast("☁ Saved — all users will see this on next load");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch(err){
      setSaveStatus("error");
      setToast(`⚠ Save failed: ${err.message}`);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }

  // ── Save brief ────────────────────────────────────────────────────────────
  async function handleSaveBrief(text){
    setBrief(text);
    try {
      await fetch("/api/project", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ projectCode:auth.projectCode, brief:text }),
      });
      setToast("✓ Brief saved");
    } catch {
      setToast("⚠ Brief saved locally — DB sync failed");
    }
  }

  // ── Login handlers ────────────────────────────────────────────────────────
  function handleAdminLogin({ projectCode, projectName }){
    setAuth({ role:"admin", projectCode, projectName, memberName:"Admin" });
    setTab("brief");
  }

  function handleBucketLogin({ projectCode, projectName, bucketId, bucketName, bucketTaskIds, memberName }){
    setAuth({ role:"bucket", projectCode, projectName, bucketId, bucketName, bucketTaskIds, memberName });
    setTab("brief");
  }

  function handleCreateProject({ projectCode, projectName }){
    setAuth({ role:"admin", projectCode, projectName, memberName:"Admin" });
    setTab("brief");
  }

  function logout(){
    setAuth(null); setTasks([]); setBuckets([]); setRaci({}); setBrief(""); setTab("brief");
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!auth){
    return (
      <LoginScreen
        onAdminLogin={handleAdminLogin}
        onBucketLogin={handleBucketLogin}
        onCreateProject={handleCreateProject} />
    );
  }

  const isAdmin = auth.role === "admin";
  const TABS    = isAdmin ? TABS_ADMIN : TABS_MEMBER;

  const saveLabel = saveStatus==="saving"?"Saving…"
    : saveStatus==="saved" ?"✓ Saved"
    : saveStatus==="error" ?"⚠ Failed"
    : "☁ Save";
  const saveBg = saveStatus==="saved"?"#1A5C2A":saveStatus==="error"?"#8B1A1A":"rgba(255,255,255,.12)";
  const saveFg = saveStatus==="saved"?"#74C69D":saveStatus==="error"?"#FFE0E0":"#fff";

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:B.st,
      minHeight:"100vh", color:B.tx, paddingBottom:isMobile?80:0 }}>

      {/* ── HEADER ── */}
      <div style={{ background:B.dk, padding:`0 ${isMobile?12:20}px`, display:"flex",
        alignItems:"center", gap:12, height:54, position:"sticky", top:0, zIndex:200,
        boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>

        {/* Logo */}
        <div style={{ width:34, height:34, borderRadius:"50%", background:B.lt, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:11, fontWeight:700, color:B.dk }}>PM</span>
        </div>

        {/* Project name */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontWeight:700, fontSize:14, lineHeight:1.1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {auth.projectName || auth.projectCode}
          </div>
          {!isMobile && (
            <div style={{ color:B.lt, fontSize:10 }}>
              {isAdmin ? "Admin" : `${auth.memberName} · ${auth.bucketName}`}
            </div>
          )}
        </div>

        {/* Desktop tabs */}
        {!isMobile && (
          <div style={{ display:"flex", gap:2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:"5px 11px", borderRadius:20, border:"none", cursor:"pointer",
                  fontSize:11, fontWeight:600, transition:"all .15s",
                  background:tab===t.id?B.lt:"transparent", color:tab===t.id?B.dk:B.pl }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
          {/* Role badge */}
          <div style={{ padding:"3px 10px", borderRadius:20,
            background:isAdmin?"rgba(116,198,157,.2)":"rgba(64,145,108,.3)",
            border:"1px solid rgba(116,198,157,.3)" }}>
            <span style={{ fontSize:10, fontWeight:600, color:B.lt }}>
              {isAdmin ? "Admin" : auth.memberName || "Member"}
            </span>
          </div>

          {/* Save */}
          <button onClick={saveToServer} disabled={saveStatus==="saving"}
            style={{ padding:"5px 14px", borderRadius:20, fontSize:11, fontWeight:700,
              border:"none", cursor:saveStatus==="saving"?"wait":"pointer",
              background:saveBg, color:saveFg, transition:"all .2s" }}>
            {saveLabel}
          </button>

                {/* ── Excel export ──  */}
          <button
            onClick={() => exportToExcel({ projectName:auth.projectName, brief, tasks, buckets, raci })}
            style={{ padding:"5px 11px", borderRadius:20, fontSize:11, fontWeight:600,
              background:"rgba(116,198,157,.2)", color:B.lt,
              border:"1px solid rgba(116,198,157,.3)", cursor:"pointer" }}>
            ⬇ Excel
          </button>

          {/* Logout */}
          <button onClick={logout} title="Logout"
            style={{ padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:600,
              background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.6)",
              border:"none", cursor:"pointer" }}>
            🔓
          </button>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loadingData && (
        <div style={{ textAlign:"center", padding:"40px 0", color:B.tg, fontSize:13 }}>
          Loading project data…
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {!loadingData && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:isMobile?"16px 14px":"22px 18px" }}>
          {tab==="brief"     && <Brief brief={brief} onSaveBrief={handleSaveBrief} isAdmin={isAdmin} />}
          {tab==="dashboard" && <Dashboard tasks={tasks} buckets={buckets} projectName={auth.projectName} auth={auth} onNav={setTab} />}
          {tab==="tasks"     && <Tasks tasks={tasks} setTasks={setTasks} buckets={buckets} isAdmin={isAdmin} myBucketId={auth.bucketId} projectCode={auth.projectCode} setToast={setToast} />}
          {tab==="buckets"   && isAdmin && <Buckets tasks={tasks} setTasks={setTasks} buckets={buckets} setBuckets={setBuckets} projectCode={auth.projectCode} setToast={setToast} />}
          {tab==="gantt"     && <Gantt tasks={tasks} buckets={buckets} isMobile={isMobile} />}
          {tab==="raci"      && <Raci tasks={tasks} buckets={buckets} raci={raci} setRaci={setRaci} auth={auth} setToast={setToast} isMobile={isMobile} />}
          {tab==="report"    && <Report tasks={tasks} buckets={buckets} raci={raci} projectName={auth.projectName} brief={brief} />}
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:B.wh,
          borderTop:`1px solid ${B.pl}`, display:"flex", zIndex:200,
          paddingBottom:"env(safe-area-inset-bottom)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, border:"none", background:"transparent",
                padding:"8px 2px 6px", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:0 }}>
              <span style={{ fontSize:16 }}>{t.icon}</span>
              <span style={{ fontSize:8, fontWeight:700, color:tab===t.id?B.ac:B.tg, lineHeight:1 }}>{t.label}</span>
              {tab===t.id && <div style={{ width:16, height:3, borderRadius:99, background:B.ac }} />}
            </button>
          ))}
          {/* Floating save button on mobile */}
          <button onClick={saveToServer} disabled={saveStatus==="saving"}
            style={{ position:"absolute", top:-42, right:14, padding:"8px 18px", borderRadius:99,
              fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
              background:saveStatus==="saved"?"#1A5C2A":B.dk,
              color:saveStatus==="saved"?"#74C69D":"#fff",
              boxShadow:"0 2px 8px rgba(0,0,0,.3)" }}>
            {saveLabel}
          </button>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
