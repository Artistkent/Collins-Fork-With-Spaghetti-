import { useState } from "react";
import { B } from "../../constants.js";
import { Inp, Btn } from "../primitives.jsx";
import { FileParser } from "../FileParser.jsx";

const LBL = { fontSize:11, fontWeight:700, color:"#607466", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 };

export function LoginScreen({ onAdminLogin, onBucketLogin, onCreateProject }){
  const [mode, setMode] = useState(null);

  return (
    <div style={{ minHeight:"100vh", background:B.dk, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:B.lt,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <span style={{ fontWeight:700, fontSize:20, color:B.dk }}>PM</span>
        </div>
        <div style={{ color:"#fff", fontWeight:700, fontSize:24, letterSpacing:-.4 }}>Project Manager</div>
        <div style={{ color:B.lt, fontSize:13, marginTop:4 }}>Collaborative project & RACI platform</div>
      </div>

      {/* Entry cards */}
      {mode === null && (
        <div style={{ display:"flex", gap:14, maxWidth:600, width:"100%", flexWrap:"wrap", justifyContent:"center" }}>
          {[
            { icon:"✨", title:"Create New Project",   desc:"Set up a project, add tasks and authority buckets — you become the admin", m:"create" },
            { icon:"🔐", title:"Admin Login",          desc:"Log in with your project code and admin password", m:"admin" },
            { icon:"🪣", title:"Join via Bucket Code", desc:"Enter the authority code your admin gave you and supply your name", m:"bucket" },
          ].map(card => (
            <button key={card.m} onClick={() => setMode(card.m)}
              style={{ flex:"1 1 160px", background:card.m==="create"?"rgba(116,198,157,.15)":"rgba(255,255,255,.07)",
                border:`1.5px solid rgba(116,198,157,${card.m==="create"?.5:.3})`, borderRadius:16,
                padding:"24px 18px", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{card.icon}</div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:14, marginBottom:6, lineHeight:1.3 }}>{card.title}</div>
              <div style={{ color:B.lt, fontSize:11, lineHeight:1.5 }}>{card.desc}</div>
            </button>
          ))}
        </div>
      )}

      {mode === "admin"  && <AdminLoginForm  onLogin={onAdminLogin}  onBack={() => setMode(null)} />}
      {mode === "bucket" && <BucketLoginForm onLogin={onBucketLogin} onBack={() => setMode(null)} />}
      {mode === "create" && <CreateForm onComplete={onCreateProject} onBack={() => setMode(null)} />}
    </div>
  );
}

// ── Admin login ───────────────────────────────────────────────────────────────
function AdminLoginForm({ onLogin, onBack }){
  const [projectCode, setProjectCode] = useState("");
  const [password,    setPassword]    = useState("");
  const [err,         setErr]         = useState("");
  const [loading,     setLoading]     = useState(false);

  async function attempt(){
    const code = projectCode.trim().toUpperCase();
    if (!code)     { setErr("Enter the project code."); return; }
    if (!password) { setErr("Enter your admin password."); return; }
    setLoading(true); setErr("");
    try {
      const res  = await fetch("/api/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ projectCode:code, password, loginType:"admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok){ setErr(data.error || "Invalid credentials."); return; }
      onLogin({ projectCode:code, projectName:data.projectName, role:"admin" });
    } catch {
      setErr("Could not reach server — check your connection.");
    } finally { setLoading(false); }
  }

  return (
    <FormBox title="Admin Login" sub="Enter your project code and admin password.">
      <label style={LBL}>Project Code</label>
      <Inp value={projectCode} onChange={e => setProjectCode(e.target.value.toUpperCase())}
        placeholder="e.g. PROJ2026" style={{ marginBottom:12 }} />
      <label style={LBL}>Admin Password</label>
      <Inp value={password} type="password" onChange={e => setPassword(e.target.value)}
        placeholder="Your admin password" style={{ marginBottom:err?8:16 }}
        onKeyDown={e => e.key==="Enter" && attempt()} />
      {err && <ErrBox msg={err} />}
      <Btn onClick={attempt} disabled={loading} style={{ width:"100%", marginBottom:8 }}>
        {loading ? "Checking…" : "Login as Admin →"}
      </Btn>
      <Btn onClick={onBack} variant="ghost" style={{ width:"100%" }}>Back</Btn>
    </FormBox>
  );
}

// ── Bucket login ──────────────────────────────────────────────────────────────
function BucketLoginForm({ onLogin, onBack }){
  const [bucketCode, setBucketCode] = useState("");
  const [name,       setName]       = useState("");
  const [err,        setErr]        = useState("");
  const [loading,    setLoading]    = useState(false);

  async function attempt(){
    const code = bucketCode.trim().toUpperCase();
    const nm   = name.trim();
    if (!code) { setErr("Enter the authority bucket code."); return; }
    if (!nm)   { setErr("Enter your name."); return; }
    setLoading(true); setErr("");
    try {
      const res  = await fetch("/api/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bucketCode:code, memberName:nm, loginType:"bucket" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok){ setErr(data.error || "Invalid bucket code."); return; }
      onLogin({
        projectCode:   data.projectCode,
        projectName:   data.projectName,
        bucketId:      data.bucketId,
        bucketName:    data.bucketName,
        bucketTaskIds: data.taskIds,
        memberName:    nm,
        role:          "bucket",
      });
    } catch {
      setErr("Could not reach server — check your connection.");
    } finally { setLoading(false); }
  }

  return (
    <FormBox title="Join via Bucket Code" sub="Your admin will give you a bucket code. Enter it here along with your name.">
      <label style={LBL}>Authority Bucket Code</label>
      <Inp value={bucketCode} onChange={e => setBucketCode(e.target.value.toUpperCase())}
        placeholder="e.g. DESIGN-X4" style={{ marginBottom:12 }} />
      <label style={LBL}>Your Name</label>
      <Inp value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. Sarah Johnson" style={{ marginBottom:err?8:16 }}
        onKeyDown={e => e.key==="Enter" && attempt()} />
      {err && <ErrBox msg={err} />}
      <Btn onClick={attempt} disabled={loading} style={{ width:"100%", marginBottom:8 }}>
        {loading ? "Looking up…" : "Join Project →"}
      </Btn>
      <Btn onClick={onBack} variant="ghost" style={{ width:"100%" }}>Back</Btn>
    </FormBox>
  );
}

// ── Create project wizard ─────────────────────────────────────────────────────
// step 0 = file upload (optional)
// step 1 = project details form (pre-filled if file was parsed)
function CreateForm({ onComplete, onBack }){
  const [step,   setStep]   = useState(0); // 0=file, 1=details
  const [name,   setName]   = useState("");
  const [code,   setCode]   = useState("");
  const [pw,     setPw]     = useState("");
  const [desc,   setDesc]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  // Called when FileParser successfully parses a file
  function handleParsed(data){
    if (data.projectName) {
      setName(data.projectName);
      setCode(data.projectName.replace(/\s+/g,"").toUpperCase().slice(0,8));
    }
    if (data.description) setDesc(data.description);
    setStep(1);
  }

  async function save(){
    const c = code.trim().toUpperCase();
    if (!name.trim()) { setErr("Project name is required."); return; }
    if (!c)           { setErr("Project code is required."); return; }
    if (!pw.trim())   { setErr("Admin password is required."); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/create-project", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          projectCode:   c,
          projectName:   name.trim(),
          description:   desc.trim(),
          adminPassword: pw.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to create project");
      onComplete({ projectCode:c, projectName:name.trim() });
    } catch(e) {
      setErr(e.message);
    } finally { setSaving(false); }
  }

  // ── Step 0: file upload ───────────────────────────────────────────────────
  if (step === 0){
    return (
      <div style={{ background:B.dk, display:"flex", alignItems:"center", justifyContent:"center", width:"100%" }}>
        <FileParser
          onParsed={handleParsed}
          onSkip={() => setStep(1)} />
      </div>
    );
  }

  // ── Step 1: project details form ─────────────────────────────────────────
  return (
    <FormBox title="Create New Project" sub="Review and fill in the details. You'll add tasks and authority buckets once inside.">
      <label style={LBL}>Project Name</label>
      <Inp value={name}
        onChange={e => { setName(e.target.value); setCode(e.target.value.replace(/\s+/g,"").toUpperCase().slice(0,8)); }}
        placeholder="e.g. Oxford Debate 2026" style={{ marginBottom:12 }} />

      <label style={LBL}>Project Code (max 8 chars)</label>
      <Inp value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0,8))}
        placeholder="e.g. OXF2026" style={{ marginBottom:12 }} />

      <label style={LBL}>Admin Password</label>
      <div style={{ position:"relative", marginBottom:12 }}>
        <Inp value={pw} type={showPw?"text":"password"} onChange={e => setPw(e.target.value)}
          placeholder="Choose a secure password" />
        <button type="button" onClick={() => setShowPw(v => !v)}
          style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", fontSize:12, color:B.tg, fontWeight:600 }}>
          {showPw ? "Hide" : "Show"}
        </button>
      </div>

      <label style={LBL}>Description (optional)</label>
      <textarea value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Brief description of the project…"
        style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${B.pl}`, borderRadius:9,
          fontSize:13, color:B.tx, background:B.wh, boxSizing:"border-box", height:72,
          resize:"vertical", marginBottom:err?8:16 }} />

      {err && <ErrBox msg={err} />}

      <Btn onClick={save} disabled={saving} style={{ width:"100%", marginBottom:8 }}>
        {saving ? "Creating…" : "Create Project →"}
      </Btn>
      <Btn onClick={() => setStep(0)} variant="ghost" style={{ width:"100%", marginBottom:8 }}>
        ← Back to file upload
      </Btn>
      <Btn onClick={onBack} variant="ghost" style={{ width:"100%" }}>Cancel</Btn>
    </FormBox>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function FormBox({ title, sub, children }){
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", maxWidth:420, width:"100%" }}>
      <h3 style={{ margin:"0 0 4px", color:B.dk, fontSize:18 }}>{title}</h3>
      <p style={{ color:"#607466", fontSize:13, margin:"0 0 20px", lineHeight:1.5 }}>{sub}</p>
      {children}
    </div>
  );
}

function ErrBox({ msg }){
  return (
    <div style={{ color:"#8B1A1A", fontSize:12, padding:"8px 12px", background:"#FFE0E0",
      borderRadius:8, marginBottom:12 }}>{msg}</div>
  );
}
