import { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // npm install xlsx


const DEFAULT_TASKS=[
  {id:1, desc:"Default",       owner:"Collins",    start:"2026-01-01",end:"2026-12-31",status:"Complete",   pri:"High", deps:"",    notes:"NIL",                                        pct:100}
]; 

// ── Brand ─────────────────────────────────────────────────────────────────────
const B = {
  dk:"#1A3C2E",md:"#2D6A4F",ac:"#40916C",lt:"#74C69D",
  pl:"#D8F3DC",st:"#EBF7EE",tx:"#1C2B22",tm:"#3A5242",
  tg:"#607466",wh:"#FFFFFF",
};
const AREA_COLOR={Strategy:"#1A3C2E",Operations:"#2D6A4F",Training:"#52B788",Comms:"#40916C",Media:"#74C69D"};
const STATUS_STYLE={
  "Complete":   {bg:"#C6EFCE",fg:"#1A5C2A",bd:"#74C69D"},
  "In Progress":{bg:"#FFF3CD",fg:"#7A5000",bd:"#F0C040"},
  "Not Started":{bg:"#FFE0E0",fg:"#8B1A1A",bd:"#E08080"},
};
const PRI_STYLE={
  Critical:{bg:"#1A3C2E",fg:"#fff"},High:{bg:"#40916C",fg:"#fff"},
  Medium:{bg:"#D8F3DC",fg:"#2D6A4F"},Low:{bg:"#f0f0f0",fg:"#555"},
};
const RACI_CYCLE=["","R","A","C","I"];
const RACI_STYLE={
  R:{bg:"#1A3C2E",fg:"#fff"},A:{bg:"#40916C",fg:"#fff"},
  C:{bg:"#D8F3DC",fg:"#1A3C2E"},I:{bg:"#e4e4e4",fg:"#555"},
  "":{bg:"transparent",fg:"#bbb"},
};

// ── Team (V1.1) ───────────────────────────────────────────────────────────────
const TEAM=[
  {id:"callum",    name:"Callum O'Connor",   role:"President / CEO",              area:"Strategy",   resp:"NSU approvals, strategic oversight, institutional alignment, internal coordination"},
  {id:"sandhya",   name:"Sandhya Chimata",    role:"Vice President / COO",         area:"Operations", resp:"Operational coordination and delivery assurance"},
  {id:"kufre",     name:"Kufre Antia",        role:"Training & Dev Manager / CTO", area:"Training",   resp:"Debate structure, speaker briefing, academic rigour, LinkedIn content capture (Audio-Visual), Documentation"},
  {id:"tolulope",  name:"Tolulope Idowu",     role:"Project Manager",              area:"Comms",      resp:"Promotion, Budget oversight, partnerships with depts & societies"},
  {id:"uchechukwu",name:"Uchechukwu Maduwuba",role:"Event / Media Manager",        area:"Media",      resp:"Audio Visuals, Media, Venue and NSU Logistics"},
];

// ── Tasks (V1.1 — tasks 2,3 Complete; task 5 In Progress; task 11 restored) ──


const DEFAULT_RACI={
  1:{callum:"A",sandhya:"C",kufre:"I",tolulope:"R",uchechukwu:"I"},
  2:{callum:"A",sandhya:"C",kufre:"R",tolulope:"I",uchechukwu:"I"},
  3:{callum:"A",sandhya:"I",kufre:"I",tolulope:"R",uchechukwu:"C"},
  4:{callum:"R",sandhya:"A",kufre:"C",tolulope:"I",uchechukwu:"I"},
  5:{callum:"A",sandhya:"I",kufre:"C",tolulope:"R",uchechukwu:"I"},
  6:{callum:"A",sandhya:"I",kufre:"R",tolulope:"C",uchechukwu:"I"},
  7:{callum:"A",sandhya:"I",kufre:"R",tolulope:"I",uchechukwu:"I"},
  8:{callum:"A",sandhya:"I",kufre:"C",tolulope:"R",uchechukwu:"C"},
  9:{callum:"A",sandhya:"I",kufre:"I",tolulope:"R",uchechukwu:"I"},
  10:{callum:"A",sandhya:"I",kufre:"C",tolulope:"R",uchechukwu:"I"},
  11:{callum:"R",sandhya:"I",kufre:"A",tolulope:"I",uchechukwu:"I"},
  12:{callum:"A",sandhya:"I",kufre:"R",tolulope:"I",uchechukwu:"I"},
  13:{callum:"A",sandhya:"I",kufre:"I",tolulope:"C",uchechukwu:"R"},
  14:{callum:"A",sandhya:"I",kufre:"C",tolulope:"R",uchechukwu:"I"},
  15:{callum:"A",sandhya:"I",kufre:"R",tolulope:"C",uchechukwu:"I"},
  16:{callum:"A",sandhya:"C",kufre:"I",tolulope:"C",uchechukwu:"R"},
  17:{callum:"A",sandhya:"R",kufre:"R",tolulope:"R",uchechukwu:"R"},
  18:{callum:"A",sandhya:"I",kufre:"R",tolulope:"C",uchechukwu:"I"},
  19:{callum:"A",sandhya:"I",kufre:"C",tolulope:"R",uchechukwu:"I"},
};

// ── Auth & Role Definitions ──────────────────────────────────────────────────
// NOTE: These passwords live client-side — fine for an internal committee tool.
// For production auth, validate credentials server-side via /api/login.
const PROJECT_CODE="NC2026";
const MEMBER_AUTH={
  callum:     {password:"callum26",  role:"admin"},
  sandhya:    {password:"sandhya26", role:"admin"},
  kufre:      {password:"kufre26",   role:"pm"},
  tolulope:   {password:"tolu26",    role:"pm"},
  uchechukwu: {password:"uche26",    role:"member"},
  viewer:     {password:"view26",    role:"viewer"},
};
const ROLE_DEFS={
  admin: {label:"Admin",            badge:"#1A3C2E",canEdit:["desc","owner","start","end","status","pri","pct","deps","notes"],canCreate:true, canDelete:true, tabs:["home","dashboard","tasks","gantt","raci","team","report","edit"]},
  pm:    {label:"Project Manager",  badge:"#2D6A4F",canEdit:["desc","owner","start","end","status","pri","pct","deps","notes"],canCreate:true, canDelete:false,tabs:["home","dashboard","tasks","gantt","raci","team","report","edit"]},
  member:{label:"Committee Member", badge:"#40916C",canEdit:["status","pct","notes"],                                         canCreate:false,canDelete:false,tabs:["home","dashboard","tasks","gantt","raci","team","report","edit"]},
  viewer:{label:"Viewer",           badge:"#607466",canEdit:[],                                                               canCreate:false,canDelete:false,tabs:["home","dashboard","report"]},
};

// ── Create Project Wizard ─────────────────────────────────────────────────────
function CreateProjectWizard({onComplete,onBack}){
  const[step,setStep]=useState(1);
  const[projName,setProjName]=useState("");
  const[projCode,setProjCode]=useState("");
  const[adminPw,setAdminPw]=useState("");
  const[projDesc,setProjDesc]=useState("");
  const[tasks,setTasks]=useState([
    {id:1,desc:"",owner:TEAM[0].id,start:"",end:"",status:"Not Started",pri:"Medium",pct:0,deps:"",notes:""},
  ]);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");

//Toggle for password eye

    const [type, setType] = useState('password');

const handleToggle = () => setType(t => t === 'password' ? 'text' : 'password');


  function addTask(){
    const nid=tasks.length?Math.max(...tasks.map(t=>t.id))+1:1;
    setTasks(ts=>[...ts,{id:nid,desc:"",owner:TEAM[0].id,start:"",end:"",status:"Not Started",pri:"Medium",pct:0,deps:"",notes:""}]);
  }
  function updTask(i,k,v){setTasks(ts=>ts.map((t,j)=>j===i?{...t,[k]:v}:t));}
  function removeTask(i){setTasks(ts=>ts.filter((_,j)=>j!==i));}

  async function handleSave(){
    if(!projName.trim()||!projCode.trim()||!adminPw.trim()){setErr("Project name, code and password are required.");return;}
    if(tasks.some(t=>!t.desc.trim())){setErr("All tasks must have a description.");return;}
    setSaving(true);setErr("");
    try{
      const res=await fetch("/api/create-project",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({projectCode:projCode.toUpperCase(),projectName:projName,description:projDesc,adminPassword:adminPw,tasks}),
      });
      if(!res.ok){const e=await res.json();throw new Error(e.error||"Save failed");}
      onComplete({projectName:projName,projectCode:projCode.toUpperCase(),adminPassword:adminPw,tasks});
    }catch(e){setErr(`Failed to save: ${e.message}`);}
    finally{setSaving(false);}
  }

  const fi={width:"100%",padding:"9px 12px",border:"1.5px solid #D8F3DC",borderRadius:9,fontSize:13,color:"#1C2B22",background:"#fff",boxSizing:"border-box"};
  const pBtn=(bg,fg,mt=0,disabled=false)=>({width:"100%",padding:"12px 0",borderRadius:10,border:bg==="transparent"?"1.5px solid #D8F3DC":"none",background:disabled?"#aaa":bg,color:fg,fontSize:14,fontWeight:700,cursor:disabled?"wait":"pointer",marginTop:mt,opacity:disabled?.7:1});

  return<div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:540,width:"100%",margin:"0 auto",maxHeight:"85vh",overflowY:"auto"}}>
    {/* Progress */}
    <div style={{display:"flex",gap:6,marginBottom:22}}>
      {[1,2].map((s,i)=><div key={i} style={{flex:1,height:4,borderRadius:99,background:step>=s?"#1A3C2E":"#D8F3DC",transition:"background .3s"}}/>)}
    </div>

    {/* ── Step 1: Project Details ── */}
    {step===1&&<>
      <div style={{fontSize:22,marginBottom:8}}>🏗</div>
      <h3 style={{margin:"0 0 4px",color:"#1A3C2E",fontSize:18}}>Project Setup</h3>
      <p style={{color:"#607466",fontSize:13,margin:"0 0 18px"}}>Enter your project details. The code is used to log in.</p>
      {[
        ["PROJECT NAME","text",projName,v=>{setProjName(v);setProjCode(v.replace(/\s+/g,"").toUpperCase().slice(0,8));},"e.g. Oxford Debate 2026"],
        ["PROJECT CODE (max 8 chars)","text",projCode,v=>setProjCode(v.toUpperCase().slice(0,8)),"e.g. OXF2026"],
        ["ADMIN PASSWORD","password",adminPw,v=>setAdminPw(v),"Choose a secure password"],
      ].map(([lbl,type,val,set,ph])=><div key={lbl} style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:700,color:"#607466",display:"block",marginBottom:4}}>{lbl}</label>
        <input style={fi} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)}/>

{type==="password" ? <button
    type="button"
    onClick={handleToggle}
    style={{position:"relative",right:10,top:"",transform:"",
      background:"none",border:"none",cursor:"pointer",fontSize:12,
      color:"#607466",fontWeight:600,padding:"2px 4px"}}
  >
    {type==="password" ? "Show" : "Hide"}
  </button>  : ""}
  


      </div>)}
      <div style={{marginBottom:16}}>
        <label style={{fontSize:11,fontWeight:700,color:"#607466",display:"block",marginBottom:4}}>DESCRIPTION (optional)</label>
        <textarea style={{...fi,height:64,resize:"vertical"}} placeholder="Brief project description..." value={projDesc} onChange={e=>setProjDesc(e.target.value)}/>
      </div>
      {err&&<div style={{color:"#8B1A1A",fontSize:12,padding:"7px 10px",background:"#FFE0E0",borderRadius:7,marginBottom:10}}>{err}</div>}
      <button style={pBtn("#1A3C2E","#fff")} onClick={()=>{if(!projName||!projCode||!adminPw){setErr("All fields required.");return;}setErr("");setStep(2);}}>Next: Add Tasks →</button>
      <button style={pBtn("transparent","#607466",8)} onClick={onBack}>Back</button>
    </>}

    {/* ── Step 2: Tasks ── */}
    {step===2&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{margin:0,color:"#1A3C2E",fontSize:18}}>Add Tasks</h3>
          <p style={{color:"#607466",fontSize:13,margin:"3px 0 0"}}>{tasks.length} task{tasks.length!==1?"s":""} · saved to Neon on creation</p>
        </div>
        <button onClick={addTask} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#1A3C2E",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>+ Add Task</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16,maxHeight:380,overflowY:"auto",paddingRight:4}}>
        {tasks.map((t,i)=><div key={t.id} style={{border:"1.5px solid #D8F3DC",borderRadius:10,padding:"12px 14px",background:"#EBF7EE"}}>
          <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#607466",minWidth:20}}>#{t.id}</span>
            <input style={{...fi,marginBottom:0,flex:1}} placeholder="Task description (required)" value={t.desc} onChange={e=>updTask(i,"desc",e.target.value)}/>
            <button onClick={()=>removeTask(i)} style={{padding:"5px 9px",borderRadius:6,border:"1px solid #FFE0E0",background:"#FFE0E0",color:"#8B1A1A",cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#607466",display:"block",marginBottom:2}}>OWNER</label>
              <select style={{...fi,marginBottom:0,fontSize:12}} value={t.owner} onChange={e=>updTask(i,"owner",e.target.value)}>
                {TEAM.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#607466",display:"block",marginBottom:2}}>PRIORITY</label>
              <select style={{...fi,marginBottom:0,fontSize:12}} value={t.pri} onChange={e=>updTask(i,"pri",e.target.value)}>
                {["Low","Medium","High","Critical"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#607466",display:"block",marginBottom:2}}>START DATE</label>
              <input style={{...fi,marginBottom:0,fontSize:12}} type="date" value={t.start} onChange={e=>updTask(i,"start",e.target.value)}/>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:"#607466",display:"block",marginBottom:2}}>END DATE</label>
              <input style={{...fi,marginBottom:0,fontSize:12}} type="date" value={t.end} onChange={e=>updTask(i,"end",e.target.value)}/>
            </div>
          </div>
          <div style={{marginTop:6}}>
            <label style={{fontSize:10,fontWeight:700,color:"#607466",display:"block",marginBottom:2}}>NOTES</label>
            <input style={{...fi,marginBottom:0,fontSize:12}} placeholder="Optional notes..." value={t.notes} onChange={e=>updTask(i,"notes",e.target.value)}/>
          </div>
        </div>)}
      </div>

      {err&&<div style={{color:"#8B1A1A",fontSize:12,padding:"7px 10px",background:"#FFE0E0",borderRadius:7,marginBottom:10}}>{err}</div>}
      <button style={pBtn("#1A3C2E","#fff",0,saving)} onClick={handleSave}>
        {saving?"Saving to Database…":"💾 Save Project to Database"}
      </button>
      <button style={pBtn("transparent","#607466",8)} onClick={()=>setStep(1)}>Back</button>
    </>}
  </div>;
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({onLogin,onCreateProject}){
  const[mode,setMode]=useState(null); // null | "login" | "create"
  const[memberId,setMemberId]=useState("");
  const[projectCode,setProjectCode]=useState("");
  const[password,setPassword]=useState("");
  const[err,setErr]=useState("");

  


  function attemptLogin(){
    if(!projectCode.trim()){setErr("Enter the project code.");return;}
    if(projectCode.trim().toUpperCase()!==PROJECT_CODE){setErr("Invalid project code.");return;}
    const authEntry=MEMBER_AUTH[memberId];
    if(!memberId||!authEntry){setErr("Please select your name.");return;}
    if(password!==authEntry.password){setErr("Incorrect password.");return;}
    const member=memberId==="viewer"?{name:"Guest Viewer",role:"Viewer"}:memberObj(memberId);
    onLogin({memberId, memberName:member.name, memberRole:member.role, role:authEntry.role, roleDef:ROLE_DEFS[authEntry.role], projectCode:projectCode.trim().toUpperCase()});
  }

  const fi={width:"100%",padding:"10px 13px",border:"1.5px solid #D8F3DC",borderRadius:9,fontSize:14,color:"#1C2B22",background:"#fff",boxSizing:"border-box"};

  // Create project mode — full screen wizard
  if(mode==="create")return(
    <div style={{minHeight:"100vh",background:"#1A3C2E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:"#74C69D",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><span style={{fontWeight:700,fontSize:16,color:"#1A3C2E"}}>NC</span></div>
        <div style={{color:"#fff",fontWeight:700,fontSize:18}}>Northumbria Construct</div>
      </div>
      <CreateProjectWizard onComplete={onCreateProject} onBack={()=>setMode(null)}/>
    </div>
  );

  return<div style={{minHeight:"100vh",background:"#1A3C2E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
    {/* Logo */}
    <div style={{textAlign:"center",marginBottom:36}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:"#74C69D",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><span style={{fontWeight:700,fontSize:20,color:"#1A3C2E"}}>NC</span></div>
      <div style={{color:"#fff",fontWeight:700,fontSize:24,letterSpacing:-.4}}>Northumbria Construct</div>
      <div style={{color:"#74C69D",fontSize:13,marginTop:4}}>Project Management Platform</div>
    </div>

    {/* Two entry cards */}
    {mode===null&&<div style={{display:"flex",gap:14,maxWidth:540,width:"100%",flexWrap:"wrap",justifyContent:"center"}}>
      {[
        {icon:"🔐",title:"Login to Existing Project",desc:"Enter your project code and credentials to access your dashboard",m:"login"},
        {icon:"✨",title:"Create New Project",desc:"Upload a project brief and let Claude extract tasks and structure automatically",m:"create"},
      ].map(card=><button key={card.m} onClick={()=>setMode(card.m)} style={{flex:"1 1 220px",background:card.m==="create"?"rgba(116,198,157,.12)":"rgba(255,255,255,.07)",border:`1.5px solid rgba(116,198,157,${card.m==="create"?.5:.3})`,borderRadius:16,padding:"26px 20px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
        <div style={{fontSize:30,marginBottom:12}}>{card.icon}</div>
        <div style={{color:"#fff",fontWeight:700,fontSize:15,marginBottom:8,lineHeight:1.3}}>{card.title}</div>
        <div style={{color:"#74C69D",fontSize:12,lineHeight:1.5}}>{card.desc}</div>
      </button>)}
    </div>}

    {/* Login form */}
    {mode==="login"&&<div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:380,width:"100%"}}>
      <h3 style={{margin:"0 0 4px",color:"#1A3C2E",fontSize:18}}>Login to Project</h3>
      <p style={{color:"#607466",fontSize:13,margin:"0 0 20px"}}>Enter your project code and credentials.</p>
      <label style={{fontSize:11,fontWeight:700,color:"#607466",display:"block",marginBottom:4}}>PROJECT CODE</label>
      <input style={{...fi,marginBottom:14}} placeholder="e.g. NC2026" value={projectCode} onChange={e=>setProjectCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&attemptLogin()}/>
      <label style={{fontSize:11,fontWeight:700,color:"#607466",display:"block",marginBottom:4}}>YOUR NAME</label>
      <select style={{...fi,marginBottom:14}} value={memberId} onChange={e=>setMemberId(e.target.value)}>
        <option value="">— Select your name —</option>
        {TEAM.map(m=><option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
        <option value="viewer">Guest Viewer</option>
      </select>
      <label style={{fontSize:11,fontWeight:700,color:"#607466",display:"block",marginBottom:4}}>PASSWORD</label>
      <input style={{...fi,marginBottom:err?8:16}} type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attemptLogin()}/>
      {err&&<div style={{color:"#8B1A1A",fontSize:12,marginBottom:12,padding:"7px 10px",background:"#FFE0E0",borderRadius:7}}>{err}</div>}
      <button onClick={attemptLogin} style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"#1A3C2E",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:8}}>Login →</button>
      <button onClick={()=>{setMode(null);setErr("");setPassword("");}} style={{width:"100%",padding:"9px 0",borderRadius:10,border:"1.5px solid #D8F3DC",background:"transparent",color:"#607466",fontSize:13,cursor:"pointer"}}>Back</button>
    </div>}
  </div>;
}

// ── Task DB Updater ──────────────────────────────────────────────────────────────────────────────
const DB_FIELDS=[
  {key:"desc",  label:"Description", type:"text"},
  {key:"owner", label:"Owner",       type:"select"},
  {key:"start", label:"Start Date",  type:"date"},
  {key:"end",   label:"End Date",    type:"date"},
  {key:"status",label:"Status",      type:"select"},
  {key:"pri",   label:"Priority",    type:"select"},
  {key:"pct",   label:"% Done",      type:"number"},
  {key:"deps",  label:"Dependencies",type:"text"},
  {key:"notes", label:"Notes",       type:"textarea"},
];
const DB_STATUS=["Not Started","In Progress","Complete"];
const DB_PRI=["Low","Medium","High","Critical"];
const DB_LBL={display:"block",fontSize:11,fontWeight:700,color:B.tg,marginBottom:4,textTransform:"uppercase",letterSpacing:.5};
const DB_INP={width:"100%",padding:"9px 11px",border:`1.5px solid ${B.pl}`,borderRadius:9,color:B.tx,background:B.st,fontSize:13,boxSizing:"border-box"};
const DB_INP_ON={...DB_INP,border:`1.5px solid ${B.ac}`,background:"#fff"};

// Defined OUTSIDE TaskUpdater so React never remounts it on re-render
function FieldRow({fkey,label,type,mode,enabled,fields,onToggle,onUpdate}){
  const on=mode==="create"||!!enabled[fkey];
  const val=fields[fkey]??"";
  const disabled=mode==="edit"&&!enabled[fkey];
  const s=on?DB_INP_ON:DB_INP;
  const ctrl=
    type==="text"     ?<input style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)} placeholder={fkey==="deps"?"e.g. 3,5":""}/>
    :type==="date"    ?<input style={s} type="date" disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}/>
    :type==="number"  ?<input style={s} type="number" min={0} max={100} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,parseInt(e.target.value)||0)}/>
    :type==="textarea"?<textarea style={{...s,height:64,resize:"vertical"}} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}/>
    :fkey==="owner"   ?<select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{TEAM.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
    :fkey==="status"  ?<select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{DB_STATUS.map(v=><option key={v}>{v}</option>)}</select>
    :fkey==="pri"     ?<select style={s} disabled={disabled} value={val} onChange={e=>onUpdate(fkey,e.target.value)}>{DB_PRI.map(v=><option key={v}>{v}</option>)}</select>
    :null;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10}}>
    {mode==="edit"&&<button onClick={()=>onToggle(fkey)} style={{marginTop:22,flexShrink:0,width:22,height:22,borderRadius:5,border:`2px solid ${on?B.ac:B.pl}`,background:on?B.ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}>
      {on&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>&#10003;</span>}
    </button>}
    <div style={{flex:1,opacity:mode==="create"||on?1:.45,transition:"opacity .2s"}}>
      <label style={DB_LBL}>{label}</label>{ctrl}
    </div>
  </div>;
}

function TaskUpdater({tasks,setTasks,setToast,canEdit=DB_FIELDS.map(f=>f.key),canCreate=true,projectCode="NC2026"}){

  const BLANK={desc:"",owner:TEAM[0].id,start:"2026-04-06",end:"2026-04-30",status:"Not Started",pri:"Medium",pct:0,deps:"",notes:""};

  const[mode,setMode]=useState("edit");
  const[selId,setSelId]=useState("");
  const[fields,setFields]=useState(BLANK);
  const[enabled,setEnabled]=useState({});
  const[submitting,setSubmitting]=useState(false);
  const[result,setResult]=useState(null);

  const selectedTask=tasks.find(t=>String(t.id)===String(selId));
  const nextId=tasks.length>0?Math.max(...tasks.map(t=>Number(t.id)))+1:1;

  function switchMode(m){setMode(m);setSelId("");setResult(null);setEnabled({});setFields(m==="create"?{...BLANK}:{});}

  useEffect(()=>{
    if(mode!=="edit"||!selectedTask){if(mode==="edit"){setFields({});setEnabled({});}return;}
    const f={};DB_FIELDS.forEach(({key})=>{f[key]=selectedTask[key]??""});
    setFields(f);setEnabled({});setResult(null);
  },[selId,mode]);

  function toggle(key){setEnabled(e=>({...e,[key]:!e[key]}));}
  function upd(key,val){setFields(f=>({...f,[key]:val}));}

  async function pushToDb(payload,isNew){
    if(payload.status==="Complete")payload.pct=100;
    payload.updatedAt=Date.now();
    setSubmitting(true);setResult(null);
    if(isNew)setTasks(prev=>[...prev,payload]);
    else setTasks(prev=>prev.map(t=>t.id===payload.id?payload:t));
    try{
      const res=await fetch("/api/update-task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload, project_code:projectCode})});
      if(res.status===404)throw new Error("API not reachable. Local state updated.");
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.error||"Request failed");
      setResult({ok:true,msg:isNew?`Task #${payload.id} created in database.`:`Task #${payload.id} updated in database.`});
      setToast(isNew?`Task #${payload.id} created`:`Task #${payload.id} updated`);
      if(isNew)setFields({...BLANK});
      else setEnabled({});
    }catch(err){
      setResult({ok:false,msg:`Local state updated but DB push failed: ${err.message}`});
    }finally{setSubmitting(false);}
  }

  function submitEdit(){
    if(!selectedTask){setResult({ok:false,msg:"Please select a task first."});return;}
    const activeKeys=Object.keys(enabled).filter(k=>enabled[k]);
    if(activeKeys.length===0){setResult({ok:false,msg:"Enable at least one field to update."});return;}
    const patch={...selectedTask};activeKeys.forEach(k=>{patch[k]=fields[k];});
    pushToDb(patch,false);
  }

  function submitCreate(){
    if(!fields.desc?.trim()){setResult({ok:false,msg:"Description is required."});return;}
    if(!fields.start||!fields.end){setResult({ok:false,msg:"Start and End dates are required."});return;}
    pushToDb({id:nextId,...fields,pct:Number(fields.pct)||0},true);
  }

  const inp=DB_INP;
  const lbl=DB_LBL;

  return<div>
    <SecHead title="Edit Tasks" sub={canCreate?"Create new tasks or update existing ones in the database.":"Update the status, progress and notes for your assigned tasks."}/>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[["edit","Edit Existing"],...(canCreate?[["create","+ Create New"]]:[])].map(([m,lab])=>
        <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:"10px 0",borderRadius:10,fontSize:13,fontWeight:700,border:`2px solid ${mode===m?B.ac:B.pl}`,background:mode===m?B.ac:B.wh,color:mode===m?"#fff":B.tg,cursor:"pointer",transition:"all .15s"}}>{lab}</button>
      )}
    </div>

    {mode==="edit"&&<>
      <Card style={{marginBottom:14}}>
        <label style={lbl}>Select Task to Edit</label>
        <select style={{...inp,marginBottom:selId?12:0}} value={selId} onChange={e=>setSelId(e.target.value)}>
          <option value="">— choose a task —</option>
          {tasks.map(t=><option key={t.id} value={t.id}>#{t.id} {t.desc.length>55?t.desc.slice(0,55)+"...":t.desc}</option>)}
        </select>
        {selectedTask&&<div style={{display:"flex",flexWrap:"wrap",gap:8,paddingTop:4}}>
          {[["Owner",memberObj(selectedTask.owner).name.split(" ")[0]],["Status",selectedTask.status],["Priority",selectedTask.pri],["Progress",`${selectedTask.pct}%`]].map(([k,v])=>
            <span key={k} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:B.pl,color:B.md,fontWeight:600}}>{k}: {v}</span>
          )}
        </div>}
      </Card>
      {selectedTask&&<>
        <Card style={{marginBottom:14}}>
          <div style={{fontSize:12,color:B.tg,marginBottom:14}}>Toggle the checkbox next to each field to enable it, then click <b style={{color:B.dk}}>Push Update to Database</b>.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {DB_FIELDS.filter(f=>canEdit.includes(f.key)).map(f=><FieldRow key={f.key} fkey={f.key} label={f.label} type={f.type} mode={mode} enabled={enabled} fields={fields} onToggle={toggle} onUpdate={upd}/>)}
          </div>
        </Card>
        <button onClick={submitEdit} disabled={submitting||Object.values(enabled).every(v=>!v)} style={{width:"100%",background:submitting?"#888":B.dk,color:"#fff",padding:"13px 0",borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:submitting?"wait":"pointer",marginBottom:10,transition:"background .2s"}}>
          {submitting?"Pushing to database...":"Push Update to Database"}
        </button>
        {result&&<div style={{padding:"10px 14px",borderRadius:10,background:result.ok?"#C6EFCE":"#FFE0E0",color:result.ok?"#1A5C2A":"#8B1A1A",fontSize:13,fontWeight:600}}>{result.msg}</div>}
      </>}
    </>}

    {mode==="create"&&<>
      <Card style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:12,color:B.tg}}>Fill in all fields. Description, Start and End are required.</div>
          <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:B.pl,color:B.md,fontWeight:700}}>New ID: #{nextId}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {DB_FIELDS.map(f=><FieldRow key={f.key} fkey={f.key} label={f.label} type={f.type} mode={mode} enabled={enabled} fields={fields} onToggle={toggle} onUpdate={upd}/>)}
        </div>
      </Card>
      <button onClick={submitCreate} disabled={submitting} style={{width:"100%",background:submitting?"#888":B.ac,color:"#fff",padding:"13px 0",borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:submitting?"wait":"pointer",marginTop:8,marginBottom:10,transition:"background .2s"}}>
        {submitting?"Creating task...":"+ Create Task in Database"}
      </button>
      {result&&<div style={{padding:"10px 14px",borderRadius:10,background:result.ok?"#C6EFCE":"#FFE0E0",color:result.ok?"#1A5C2A":"#8B1A1A",fontSize:13,fontWeight:600}}>{result.msg}</div>}
    </>}
  </div>;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
const GANTT_START=new Date("2026-04-06T12:00:00");
const GANTT_DAYS=33;
function ganttOffset(d){return Math.max(0,Math.round((new Date(d+"T12:00:00")-GANTT_START)/86400000));}
function ganttWidth(s,e){return Math.max(1,ganttOffset(e)-ganttOffset(s)+1);}
function fmtDate(d){if(!d)return"—";return new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"});}
function memberObj(id){return TEAM.find(t=>t.id===id)||{name:id,area:"",role:""};}
function initials(n){return n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();}
function calcPct(tasks){return tasks.length?Math.round(tasks.reduce((s,t)=>s+t.pct,0)/tasks.length):0;}
function loadState(key,def){try{const s=localStorage.getItem(key);return s?JSON.parse(s):JSON.parse(JSON.stringify(def));}catch{return JSON.parse(JSON.stringify(def));}}

function useIsMobile(){
  const[m,setM]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return m;
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Avatar({name,area,size=32}){
  return<div style={{width:size,height:size,borderRadius:"50%",background:AREA_COLOR[area]||B.ac,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{fontSize:size*.38,fontWeight:700,color:"#fff"}}>{initials(name)}</span>
  </div>;
}
function Badge({label,small=false}){
  const s=STATUS_STYLE[label]||{bg:B.pl,fg:B.md,bd:"transparent"};
  return<span style={{display:"inline-block",padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:600,background:s.bg,color:s.fg,border:`1px solid ${s.bd}`,whiteSpace:"nowrap"}}>{label}</span>;
}
function PriBadge({label}){
  const s=PRI_STYLE[label]||PRI_STYLE.Low;
  return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.fg,whiteSpace:"nowrap"}}>{label}</span>;
}
function Pbar({pct,h=6,done=false}){
  return<div style={{height:h,borderRadius:99,background:B.pl,overflow:"hidden",flex:1}}>
    <div style={{height:"100%",width:`${pct}%`,borderRadius:99,transition:"width .4s",background:done?"#1A5C2A":B.ac}}/>
  </div>;
}
function Card({children,style:s}){return<div style={{background:B.wh,borderRadius:14,border:`1px solid ${B.pl}`,padding:"16px 18px",...s}}>{children}</div>;}
function SecHead({title,sub}){return<div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700,color:B.dk,margin:0}}>{title}</h2>{sub&&<p style={{color:B.tg,fontSize:12,margin:"3px 0 0",lineHeight:1.4}}>{sub}</p>}</div>;}
function Toast({msg}){if(!msg)return null;return<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:B.dk,color:"#fff",padding:"10px 20px",borderRadius:99,fontSize:13,fontWeight:600,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.25)"}}>{msg}</div>;}

// ── Task modal ────────────────────────────────────────────────────────────────
function TaskModal({task,onSave,onDelete,onClose}){
  const isNew=!task.id;
  const[f,setF] = useState({desc:task.desc||"",start:task.start||"2026-04-06",end:task.end||"2026-04-07",status:task.status||"Not Started",pri:task.pri||"High",owner:task.owner||TEAM[0].id,pct:task.pct??0,deps:task.deps||"",notes:task.notes||""});
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));

  function submit(){
    if(!f.desc.trim()){
      alert("Please enter a task description.");
      return;
    }
  
  let pct=Math.min(100,Math.max(0,parseInt(f.pct)||0));if(f.status==="Complete")pct=100;onSave({...task,...f,pct,updatedAt:Date.now()});}
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);document.body.style.overflow="hidden";return()=>{window.removeEventListener("keydown",h);document.body.style.overflow="";};},[onClose]);
  const lbl={display:"block",fontSize:11,fontWeight:700,color:B.tg,marginBottom:5,textTransform:"uppercase",letterSpacing:.5};
  const inp={width:"100%",padding:"10px 12px",border:`1.5px solid ${B.pl}`,borderRadius:10,color:B.tx,background:B.st,fontSize:14,WebkitAppearance:"none",boxSizing:"border-box"};

  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(26,60,46,.55)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{background:B.wh,borderRadius:"18px 18px 0 0",padding:"24px 20px 32px",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,borderRadius:99,background:"#ddd",margin:"0 auto 18px"}}/>
      <h3 style={{fontSize:16,fontWeight:700,color:B.dk,margin:"0 0 18px"}}>{isNew?"+ Add Task":`Edit Task #${task.id}`}</h3>
      <div style={{marginBottom:14}}><label style={lbl}>Task Description</label><input style={inp} value={f.desc} onChange={e=>upd("desc",e.target.value)} placeholder="Describe the task…"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={lbl}>Start</label><input style={inp} type="date" value={f.start} onChange={e=>upd("start",e.target.value)}/></div>
        <div><label style={lbl}>End</label><input style={inp} type="date" value={f.end} onChange={e=>upd("end",e.target.value)}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={lbl}>Status</label><select style={inp} value={f.status} onChange={e=>upd("status",e.target.value)}>{["Not Started","In Progress","Complete"].map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Priority</label><select style={inp} value={f.pri} onChange={e=>upd("pri",e.target.value)}>{["Low","Medium","High","Critical"].map(p=><option key={p}>{p}</option>)}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={lbl}>Owner</label><select style={inp} value={f.owner} onChange={e=>upd("owner",e.target.value)}>{TEAM.map(m=><option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}</select></div>
        <div><label style={lbl}>% Done</label><input style={inp} type="number" min={0} max={100} value={f.pct} onChange={e=>upd("pct",e.target.value)}/></div>
      </div>
      <div style={{marginBottom:14}}><label style={lbl}>Notes</label><textarea style={{...inp,height:70,resize:"vertical"}} value={f.notes} onChange={e=>upd("notes",e.target.value)}/></div>
      <button onClick={submit} style={{width:"100%",background:B.dk,color:"#fff",padding:14,borderRadius:12,fontSize:15,fontWeight:700,border:"none",cursor:"pointer",marginBottom:10}}>{isNew?"Add Task":"Save Changes"}</button>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,background:B.pl,color:B.md,padding:12,borderRadius:12,fontSize:14,fontWeight:600,border:"none",cursor:"pointer"}}>Cancel</button>
        {!isNew&&task.id>1&&<button onClick={()=>onDelete(task.id)} style={{flex:1,background:"#FFE0E0",color:"#8B1A1A",padding:12,borderRadius:12,fontSize:14,fontWeight:600,border:"none",cursor:"pointer"}}>Delete</button>}
      </div>
    </div>
  </div>;
}

// ════════════════════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════════════════════
// ── Home sub-page: Project Brief ─────────────────────────────────────────────
function HomeBrief({isMobile,onNav}){
  const motions=[
    {n:1,m:"This House Believes That Professional Body Membership Is No Longer Essential for Career Progression in Construction.",f:"CIOB, ICE, APM relevance; employability; chartership"},
    {n:2,m:"This House Believes That Sustainability Targets Are Undermining Project Delivery Efficiency.",f:"ESG requirements, carbon targets, cost and programme pressures"},
    {n:3,m:"This house questions if construction graduates emerge fully industry-ready from universities.",f:"Curriculum relevance, graduate readiness, employability gap"},
    {n:4,m:"This house examines the extent to which university education equips construction graduates for modern industry expectations.",f:"Curriculum relevance, industry alignment, graduate competency"},
    {n:5,m:"This House Believes That Universities Are Failing to Prepare Construction Graduates for Industry.",f:"Employability gap, industry readiness, curriculum reform"},
  ];
  const fmt=[
    {seg:"Welcome & Introduction",dur:"5 mins",detail:"President opens — Northumbria Construct intro & housekeeping"},
    {seg:"Chair's Introduction",dur:"5 mins",detail:"Motion, Oxford rules and timing protocol"},
    {seg:"Pre-Debate Audience Vote",dur:"2–3 mins",detail:"Digital QR code vote before arguments"},
    {seg:"Proposition Opening",dur:"10 mins",detail:"2 speakers × 5 mins — IN FAVOUR (alternating)"},
    {seg:"Opposition Opening",dur:"10 mins",detail:"2 speakers × 5 mins — AGAINST"},
    {seg:"Moderated Q&A / Debate",dur:"25 mins",detail:"Chair facilitates; audience selected by Chair"},
    {seg:"Closing Statements",dur:"6 mins",detail:"1 speaker per side × 3 mins"},
    {seg:"Post-Debate Vote",dur:"2–3 mins",detail:"Audience re-votes; winner determined by swing"},
    {seg:"Result & Networking",dur:"10–15 mins",detail:"Chair announces result; informal engagement"},
  ];
  return<div>
    <div style={{background:B.dk,borderRadius:16,padding:isMobile?"20px 18px":"28px 32px",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-120,right:-120,width:380,height:380,borderRadius:"50%",border:"2px solid rgba(116,198,157,.12)"}}/>
      <div style={{position:"relative"}}>
        <div style={{fontSize:11,fontWeight:700,color:B.lt,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Northumbria Construct · APM Challenge</div>
        <h1 style={{fontSize:isMobile?22:28,fontWeight:800,color:"#fff",margin:"0 0 8px",lineHeight:1.2}}>Oxford-Style Debate Event</h1>
        <div style={{fontSize:14,color:B.lt,marginBottom:16}}>NSU Building – Reds Hall · 28 April 2026 · ~30 Students</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["📅","28 April"],["🕒","3pm–5pm"],["📍","Reds Hall"],["🎓","~30 Attendees"],["✅","Free Entry"]].map(([ic,lbl])=>
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.1)",borderRadius:99,padding:"5px 12px"}}>
              <span style={{fontSize:13}}>{ic}</span><span style={{fontSize:12,color:"#fff",fontWeight:600}}>{lbl}</span>
            </div>
          )}
        </div>
      </div>
    </div>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,color:B.dk,marginBottom:10}}>📄 Project Brief</div>
      <div style={{fontSize:13,color:B.tm,lineHeight:1.75,marginBottom:10}}>Northumbria Construct is organising a formal <b style={{color:B.dk}}>Oxford-Style Debate</b> as a high-value academic and professional development event for students of the Built Environment Faculty at Northumbria University, on <b style={{color:B.dk}}>Monday 28 April 2026, 3:00pm–5:00pm</b>, Reds Hall.</div>
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,color:B.dk,marginBottom:10}}>🎯 Aims & Objectives</div>
      {[
        ["Build professional skills","Develop confidence in public speaking, structured argumentation and professional discourse."],
        ["Stimulate critical thinking","Encourage intellectual engagement particularly during the examination period."],
        ["Industry relevance","Expose students to contemporary issues affecting the built environment and professional practice."],
        ["Society mission","Deliver a high-engagement, low-cost event aligned with Northumbria Construct's mission."],
        ["Visibility & growth","Increase awareness and participation of Northumbria Construct within the student body."],
      ].map(([t,d],i)=>
        <div key={t} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<4?`1px solid ${B.st}`:"none",alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:B.dk,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:800,color:B.lt}}>{i+1}</span>
          </div>
          <div><div style={{fontSize:13,fontWeight:700,color:B.dk,marginBottom:2}}>{t}</div><div style={{fontSize:12,color:B.tm,lineHeight:1.5}}>{d}</div></div>
        </div>
      )}
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,color:B.dk,marginBottom:4}}>🎙 Debate Motions</div>
      <div style={{fontSize:12,color:B.tg,marginBottom:12}}>5 motions available — one to be selected by the committee.</div>
      {motions.map(({n,m,f})=><div key={n} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:n<5?`1px solid ${B.st}`:"none",alignItems:"flex-start"}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:B.dk,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",flexShrink:0}}>{n}</div>
        <div><div style={{fontSize:13,fontWeight:600,color:B.dk,marginBottom:3,lineHeight:1.4}}>"{m}"</div><div style={{fontSize:11,color:B.tg}}>{f}</div></div>
      </div>)}
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,color:B.dk,marginBottom:4}}>⏱ Event Format — 75–90 Minutes</div>
      {fmt.map(({seg,dur,detail},i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<fmt.length-1?`1px solid ${B.st}`:"none"}}>
        <div style={{flexShrink:0,width:56,textAlign:"center",background:B.dk,borderRadius:8,padding:"4px 6px"}}><span style={{fontSize:10,fontWeight:700,color:B.lt}}>{dur}</span></div>
        <div><div style={{fontSize:12,fontWeight:600,color:B.tx}}>{seg}</div><div style={{fontSize:11,color:B.tg,marginTop:1}}>{detail}</div></div>
      </div>)}
    </Card>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <button onClick={()=>onNav("dashboard")} style={{flex:1,minWidth:140,background:B.dk,color:"#fff",padding:13,borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>View Dashboard →</button>
      <button onClick={()=>onNav("tasks")} style={{flex:1,minWidth:140,background:B.pl,color:B.dk,padding:13,borderRadius:12,fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>Open Tasks →</button>
    </div>
  </div>;
}

// ── Home sub-page: Stakeholders ───────────────────────────────────────────────
function HomeStakeholders({isMobile}){
  const[selected,setSelected]=useState(null);
  const W={power:0.30,interest:0.25,influence:0.30,ease:0.15};
  function wScore(s){return Math.round(((s.power*W.power)+(s.interest*W.interest)+(s.influence*W.influence)+(s.ease*W.ease))*100)/100;}
  function catColor(c){return c==="Key Player"?B.dk:c==="Keep Satisfied"?B.md:c==="Keep Informed"?B.ac:"#888";}
  function autoCategory(p,i){
    if(p>=4&&i>=4)return"Key Player";
    if(p>=4)return"Keep Satisfied";
    if(i>=4)return"Keep Informed";
    return"Monitor";
  }
  function wBandStyle(sc){return sc>=4?{bg:"#1A3C2E",fg:B.lt}:sc>=3?{bg:B.ac,fg:"#fff"}:sc>=2?{bg:B.pl,fg:B.md}:{bg:"#f0f0f0",fg:"#555"};}

  const raw=[
    {id:1,name:"NSU / Student Union",      type:"Internal",  power:5,interest:5,influence:4,ease:4,icon:"🏛",strategy:"Keep fully informed at every stage. NSU approved venue — critical relationship. Regular updates on attendance and logistics.",engagement:"Direct",frequency:"Weekly",owner:"Callum O'Connor"},
    {id:2,name:"Built Environment Students",type:"Beneficiary",power:2,interest:5,influence:3,ease:5,icon:"🎓",strategy:"Primary audience. Reach via WhatsApp, course reps and LinkedIn. Over-invite to 60–70 for 25+ attendance.",engagement:"Broadcast",frequency:"Bi-weekly",owner:"Tolulope Idowu"},
    {id:3,name:"Academic Staff / Lecturers",type:"External", power:3,interest:4,influence:4,ease:3,icon:"📚",strategy:"Leverage for promotion. Request forwarding of event emails. Invite as observers — increases prestige.",engagement:"Periodic",frequency:"Monthly",owner:"Tolulope Idowu"},
    {id:4,name:"Debate Chair (External)",   type:"External", power:4,interest:4,influence:4,ease:3,icon:"⚖️",strategy:"Critical to event quality. Shortlist: Kelechi Ayanso, Barry Gledson, Michelle Littlemore, Pablo Martinez.",engagement:"Direct",frequency:"Weekly post-confirm",owner:"Callum O'Connor"},
    {id:5,name:"Student Speakers",          type:"Internal", power:2,interest:5,influence:3,ease:4,icon:"🎙",strategy:"Kufre leads. Pool: Kufre, Lucas, Ikechukwu, Vemula, Judith, Adiyita, Maria. Brief by 11 Apr.",engagement:"Direct",frequency:"Bi-weekly",owner:"Kufre Antia"},
    {id:6,name:"Northumbria Univ Faculty",  type:"External", power:4,interest:3,influence:4,ease:3,icon:"🏫",strategy:"Keep satisfied with concise updates. Event must reflect positively on Faculty.",engagement:"Minimal",frequency:"Monthly",owner:"Callum O'Connor"},
    {id:7,name:"Professional Bodies",       type:"External", power:2,interest:3,influence:5,ease:2,icon:"🏆",strategy:"Post-event LinkedIn content. High influence amplifiers for long-term network.",engagement:"Post-event",frequency:"Post-event",owner:"Kufre Antia"},
    {id:8,name:"Society Alumni / LinkedIn", type:"External", power:1,interest:3,influence:3,ease:4,icon:"🔗",strategy:"Engage post-event through LinkedIn recap article.",engagement:"Post-event",frequency:"Post-event",owner:"Kufre Antia"},
  ];
  const stakeholders=raw.map(s=>({...s,score:wScore(s),category:autoCategory(s.power,s.interest),color:catColor(autoCategory(s.power,s.interest))})).sort((a,b)=>b.score-a.score);

  return<div>
    <SecHead title="Stakeholder Analysis" sub="Weighted formula: Power×0.30 + Interest×0.25 + Influence×0.30 + Ease×0.15"/>
    {/* Priority strip */}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {[["Key Player",B.dk,"#fff"],["Keep Satisfied",B.md,"#fff"],["Keep Informed",B.ac,"#fff"],["Monitor","#888","#fff"]].map(([cat,bg,fg])=>{
        const count=stakeholders.filter(s=>s.category===cat).length;
        return count>0?<div key={cat} style={{padding:"6px 14px",borderRadius:99,background:bg,color:fg,fontSize:11,fontWeight:700}}>{count} {cat}</div>:null;
      })}
    </div>
    {/* Stakeholder cards */}
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
      {stakeholders.map(s=>{
        const isSel=selected===s.id;const bs=wBandStyle(s.score);
        return<div key={s.id} style={{background:B.wh,borderRadius:12,border:`1.5px solid ${isSel?B.ac:B.pl}`,overflow:"hidden",borderLeft:`4px solid ${s.color}`}}>
          <div onClick={()=>setSelected(isSel?null:s.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer"}}>
            <div style={{width:38,height:38,borderRadius:10,background:s.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:B.dk}}>{s.name}</div>
              <div style={{fontSize:11,color:B.tg,marginTop:1}}>{s.type} · {s.owner.split(" ")[0]}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
              <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:700,background:bs.bg,color:bs.fg}}>{s.score.toFixed(2)}</span>
              <span style={{fontSize:10,color:s.color,fontWeight:700}}>{s.category}</span>
            </div>
          </div>
          <div style={{padding:"0 16px 10px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
            {[["Power",s.power,W.power],["Interest",s.interest,W.interest],["Influence",s.influence,W.influence],["Ease",s.ease,W.ease]].map(([lbl,val,wt])=>
              <div key={lbl} style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:B.tg,width:58,flexShrink:0}}>{lbl} <span style={{opacity:.6}}>×{(wt*100).toFixed(0)}%</span></span>
                <div style={{flex:1,height:4,borderRadius:99,background:B.pl,overflow:"hidden"}}><div style={{width:`${(val/5)*100}%`,height:"100%",background:s.color,borderRadius:99}}/></div>
                <span style={{fontSize:10,fontWeight:700,color:s.color,width:14,flexShrink:0}}>{val}</span>
              </div>
            )}
          </div>
          {isSel&&<div style={{padding:"10px 16px 14px",borderTop:`1px solid ${B.pl}`,background:B.st}}>
            <div style={{fontSize:12,color:B.tm,lineHeight:1.65,marginBottom:8}}>{s.strategy}</div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:B.tg}}>
              <span>Mode: <b style={{color:B.dk}}>{s.engagement}</b></span>
              <span>Frequency: <b style={{color:B.dk}}>{s.frequency}</b></span>
              <span>Owner: <b style={{color:B.dk}}>{s.owner}</b></span>
            </div>
          </div>}
        </div>;
      })}
    </div>
    {/* SVG Power-Interest Matrix */}
    <Card>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:4}}>📊 Power–Interest Matrix</div>
      <div style={{fontSize:11,color:B.tg,marginBottom:10}}>Dot size = Influence. Tap any dot for details.</div>
      <div style={{overflowX:"auto"}}>
        <svg viewBox="0 0 520 320" style={{width:"100%",maxWidth:520,display:"block"}} xmlns="http://www.w3.org/2000/svg">
          <rect x="55" y="15" width="205" height="140" fill="#EBF7EE" rx="4"/>
          <rect x="268" y="15" width="237" height="140" fill="#C6EFCE" rx="4"/>
          <rect x="55" y="163" width="205" height="137" fill="#f8f8f8" rx="4"/>
          <rect x="268" y="163" width="237" height="137" fill="#EBF7EE" rx="4"/>
          <text x="158" y="32" textAnchor="middle" fontSize="8" fontWeight="700" fill="#607466">KEEP SATISFIED</text>
          <text x="386" y="32" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1A3C2E">KEY PLAYERS</text>
          <text x="158" y="178" textAnchor="middle" fontSize="8" fontWeight="700" fill="#aaa">MONITOR</text>
          <text x="386" y="178" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2D6A4F">KEEP INFORMED</text>
          <line x1="260" y1="15" x2="260" y2="300" stroke="#74C69D" strokeWidth="1" strokeDasharray="4,3" opacity=".5"/>
          <line x1="55" y1="157" x2="505" y2="157" stroke="#74C69D" strokeWidth="1" strokeDasharray="4,3" opacity=".5"/>
          <line x1="50" y1="300" x2="510" y2="300" stroke="#B7DDBC" strokeWidth="1"/>
          <polygon points="510,297 510,303 515,300" fill="#B7DDBC"/>
          <line x1="50" y1="305" x2="50" y2="12" stroke="#B7DDBC" strokeWidth="1"/>
          <polygon points="47,12 53,12 50,7" fill="#B7DDBC"/>
          <text x="280" y="314" textAnchor="middle" fontSize="9" fill="#607466">Interest →</text>
          <text x="18" y="157" textAnchor="middle" fontSize="9" fill="#607466" transform="rotate(-90,18,157)">Power →</text>
          {stakeholders.map(s=>{
            const cx=55+((s.interest-1)/4)*450;
            const cy=300-((s.power-1)/4)*285;
            const r=s.influence*2.5+6;
            const isSel=selected===s.id;
            return<g key={s.id} onClick={()=>setSelected(selected===s.id?null:s.id)} style={{cursor:"pointer"}}>
              {isSel&&<circle cx={cx} cy={cy} r={r+8} fill={s.color} opacity=".15"/>}
              <circle cx={cx} cy={cy} r={r} fill={s.color} stroke="#fff" strokeWidth="2"/>
              <text x={cx} y={cy+4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">{s.id}</text>
            </g>;
          })}
        </svg>
      </div>
      {selected&&(()=>{const s=stakeholders.find(x=>x.id===selected);if(!s)return null;
        return<div style={{marginTop:10,padding:"10px 14px",background:B.st,borderRadius:8,borderLeft:`4px solid ${s.color}`}}>
          <div style={{fontWeight:700,fontSize:13,color:B.dk,marginBottom:4}}>{s.icon} {s.name}</div>
          <div style={{fontSize:12,color:B.tm,lineHeight:1.6}}>{s.strategy}</div>
        </div>;
      })()}
    </Card>
  </div>;
}

// ── Home sub-page: Project Team ───────────────────────────────────────────────
function HomeTeam({tasks,isMobile}){
  const coreRoles=[
    {role:"Project Manager",         resp:"Overall coordination; liaison with NSU",                  who:"Tolulope Idowu",          status:"Assigned"},
    {role:"Debate Chair / Moderator",resp:"Neutral facilitation; Oxford rules; timekeeping",          who:"Shortlist: Kelechi Ayanso · Barry Gledson · Michelle Littlemore · Pablo Martinez",status:"Shortlisted"},
    {role:"Proposition Team (2–3)",  resp:"Argue in favour of the motion",                          who:"Kufre Antia (lead) · Lucas, Ikechukwu, Vemula, Judith, Adiyita, Maria",status:"In Selection"},
    {role:"Opposition Team (2–3)",   resp:"Argue against the motion",                               who:"TBC",                     status:"Open"},
    {role:"Logistics Lead",          resp:"Reds Hall, AV, seating, 3 mics, signage",                who:"Uchechukwu Maduwuba",     status:"Assigned"},
    {role:"Comms & Engagement",      resp:"Promotion, registration, attendance",                     who:"All team",                status:"Active"},
  ];
  const stBadge=s=>s==="Assigned"||s==="Active"?{bg:"#C6EFCE",fg:"#1A5C2A"}:s==="Shortlisted"||s==="In Selection"?{bg:"#FFF3CD",fg:"#7A5000"}:{bg:"#FFE0E0",fg:"#8B1A1A"};
  return<div>
    <SecHead title="Project Team" sub="Northumbria Construct Event Planning Committee"/>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
      {TEAM.map(m=>{
        const mt=tasks.filter(t=>t.owner===m.id);const mp=calcPct(mt);const mc=mt.filter(t=>t.status==="Complete").length;
        return<Card key={m.id} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <Avatar name={m.name} area={m.area} size={46}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:B.dk}}>{m.name}</div>
            <div style={{fontSize:11,color:B.ac,fontWeight:600,marginBottom:5}}>{m.role}</div>
            <div style={{fontSize:11,color:B.tg,lineHeight:1.55}}>{m.resp}</div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:9,padding:"2px 9px",borderRadius:20,background:B.pl,color:B.md,fontWeight:700}}>{m.area}</span>
              <span style={{fontSize:9,color:B.tg}}>{mc}/{mt.length} tasks complete</span>
            </div>
            <div style={{marginTop:7,display:"flex",alignItems:"center",gap:6}}><Pbar pct={mp} h={5}/><span style={{fontSize:10,color:B.md,fontWeight:600,minWidth:30}}>{mp}%</span></div>
          </div>
        </Card>;
      })}
    </div>
    <Card style={{padding:"0",overflow:"hidden"}}>
      <div style={{background:B.md,padding:"12px 18px",fontWeight:700,fontSize:14,color:"#fff"}}>Core Delivery Roles</div>
      {coreRoles.map((r,i)=>{const sc=stBadge(r.status);return<div key={i} style={{padding:"12px 18px",background:i%2===0?B.wh:B.st,borderBottom:`1px solid ${B.pl}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,flexWrap:"wrap",gap:6}}>
          <span style={{fontSize:13,fontWeight:700,color:B.dk}}>{r.role}</span>
          <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:600,background:sc.bg,color:sc.fg}}>{r.status}</span>
        </div>
        <div style={{fontSize:11,color:B.tm,marginBottom:3}}>{r.resp}</div>
        <div style={{fontSize:11,color:B.tg}}>{r.who}</div>
      </div>;})}
    </Card>
  </div>;
}

// ── Home sub-page: Governance ─────────────────────────────────────────────────
function HomeGovernance({isMobile}){
  const decisions=[
    {type:"Strategic / Scope Changes",  approval:"Project Sponsor + President",  examples:"Changing the motion, moving the venue, cancelling"},
    {type:"Major Operational Changes",  approval:"President + Project Manager",   examples:"Rescheduling, replacing Chair, changing capacity"},
    {type:"Minor Operational Changes",  approval:"Project Manager",               examples:"Timetable tweaks, minor comms changes"},
    {type:"On-Day Decisions",           approval:"Event Lead (Callum O'Connor)",  examples:"Any decision required during the event on 28 April"},
  ];
  const gates=[
    {phase:"Gate 1 — Pre-Planning",       date:"6 Apr", status:"Complete",    check:"Motion confirmed · Venue booked · Roles assigned"},
    {phase:"Gate 2 — Speaker & Chair Lock",date:"15 Apr",status:"In Progress","check":"Chair confirmed · Speakers confirmed · Briefing packs issued"},
    {phase:"Gate 3 — Promo & Registration",date:"21 Apr",status:"Not Started","check":"Registration 25+ · AV confirmed · Run-of-show complete"},
    {phase:"Gate 4 — Go / No-Go",         date:"27 Apr",status:"Not Started","check":"Final walkthrough · Speakers reconfirmed · Venue confirmed"},
    {phase:"Event Delivery",              date:"28 Apr",status:"Not Started","check":"Event delivered · Feedback captured · Photos collected"},
    {phase:"Post-Event Closure",          date:"3 May", status:"Not Started","check":"LinkedIn published · Feedback analysed · Lessons documented"},
  ];
  const stBadge=s=>s==="Complete"?{bg:"#C6EFCE",fg:"#1A5C2A"}:s==="In Progress"?{bg:"#FFF3CD",fg:"#7A5000"}:{bg:"#e8e8e8",fg:"#777"};
  return<div>
    <SecHead title="Project Governance" sub="Decision-making, oversight, change control and gate reviews"/>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>⚖️ Decision Authority Matrix</div>
      {decisions.map((d,i)=><div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<decisions.length-1?`1px solid ${B.st}`:"none",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:B.dk,marginBottom:2}}>{d.type}</div>
          <div style={{fontSize:11,color:B.ac,fontWeight:600,marginBottom:2}}>Approved by: {d.approval}</div>
          <div style={{fontSize:11,color:B.tg,fontStyle:"italic"}}>{d.examples}</div>
        </div>
      </div>)}
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:14}}>🚦 Phase Gate Reviews</div>
      {gates.map(({phase,date,check,status},i)=>{
        const sc=stBadge(status);const isLast=i===gates.length-1;
        const dotCol=status==="Complete"?B.dk:status==="In Progress"?B.ac:"#ccc";
        return<div key={phase} style={{display:"flex",gap:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:36,flexShrink:0}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:dotCol,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,marginTop:4,flexShrink:0}}>
              {status==="Complete"&&<span style={{fontSize:8,color:"#fff",fontWeight:800}}>✓</span>}
              {status==="In Progress"&&<span style={{fontSize:7,color:"#fff",fontWeight:800}}>▶</span>}
            </div>
            {!isLast&&<div style={{width:2,flex:1,background:status==="Complete"?B.ac:"#e0e0e0",margin:"3px 0"}}/>}
          </div>
          <div style={{padding:"2px 0 18px 10px",flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3,flexWrap:"wrap",gap:4}}>
              <span style={{fontSize:13,fontWeight:700,color:B.dk}}>{phase} <span style={{fontSize:10,color:B.tg,fontWeight:400}}>({date})</span></span>
              <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,background:sc.bg,color:sc.fg}}>{status}</span>
            </div>
            <div style={{fontSize:11,color:B.tg,lineHeight:1.5}}>{check}</div>
          </div>
        </div>;
      })}
    </Card>
    <Card>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>🔄 Change Control Process</div>
      <div style={{display:"flex",overflowX:"auto",gap:0,paddingBottom:4}}>
        {[{n:"1",t:"Identify",d:"Document change with reason & impact",ic:"🔍"},{n:"2",t:"Assess",d:"PM evaluates impact on programme & budget",ic:"📊"},{n:"3",t:"Approve",d:"Minor→PM · Major→President · Critical→Sponsor",ic:"✅"},{n:"4",t:"Implement",d:"Change actioned; all documents updated",ic:"⚡"},{n:"5",t:"Review",d:"Reviewed at next check-in; lessons captured",ic:"📝"}].map(({n,t,d,ic},i,arr)=>
          <div key={n} style={{display:"flex",alignItems:"stretch",flexShrink:0}}>
            <div style={{width:isMobile?120:140,background:i%2===0?B.dk:B.md,borderRadius:i===0?"10px 0 0 10px":i===arr.length-1?"0 10px 10px 0":"0",padding:"12px 12px",display:"flex",flexDirection:"column",gap:5}}>
              <div style={{fontSize:8,color:"rgba(255,255,255,.5)",fontWeight:700}}>{n}</div>
              <div style={{fontSize:15}}>{ic}</div>
              <div style={{fontSize:11,fontWeight:800,color:"#fff"}}>{t}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.6)",lineHeight:1.4}}>{d}</div>
            </div>
            {i<arr.length-1&&<div style={{width:0,height:0,borderTop:"24px solid transparent",borderBottom:"24px solid transparent",borderLeft:`14px solid ${i%2===0?B.dk:B.md}`,alignSelf:"center",flexShrink:0}}/>}
          </div>
        )}
      </div>
    </Card>
  </div>;
}

// ── Home wrapper with sub-page navigation ─────────────────────────────────────
function Home({isMobile,onNav,tasks}){
  const[subPage,setSubPage]=useState("brief");
  const subPages=[
    {id:"brief",       label:"Project Brief",  icon:"📄"},
    {id:"stakeholders",label:"Stakeholders",   icon:"🗺"},
    {id:"team",        label:"Project Team",   icon:"👥"},
    {id:"governance",  label:"Governance",     icon:"🏛"},
  ];
  return<div>
    {/* Underline tab nav */}
    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${B.pl}`,overflowX:"auto"}}>
      {subPages.map(p=>(
        <button key={p.id} onClick={()=>setSubPage(p.id)} style={{
          display:"flex",alignItems:"center",gap:6,
          padding:isMobile?"10px 12px":"11px 18px",
          border:"none",borderBottom:`3px solid ${subPage===p.id?B.ac:"transparent"}`,
          marginBottom:"-2px",background:"transparent",
          color:subPage===p.id?B.dk:B.tg,
          fontSize:isMobile?11:12,fontWeight:subPage===p.id?800:600,
          cursor:"pointer",flexShrink:0,whiteSpace:"nowrap",transition:"color .15s",
        }}>
          <span>{p.icon}</span><span>{p.label}</span>
        </button>
      ))}
    </div>
    {subPage==="brief"        &&<HomeBrief isMobile={isMobile} onNav={onNav}/>}
    {subPage==="stakeholders" &&<HomeStakeholders isMobile={isMobile}/>}
    {subPage==="team"         &&<HomeTeam tasks={tasks} isMobile={isMobile}/>}
    {subPage==="governance"   &&<HomeGovernance isMobile={isMobile}/>}
  </div>;
}



// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function Dashboard({tasks,onNav,isMobile}){
  const done=tasks.filter(t=>t.status==="Complete").length;
  const inp=tasks.filter(t=>t.status==="In Progress").length;
  const ns=tasks.filter(t=>t.status==="Not Started").length;
  const pct=calcPct(tasks);
  const dLeft=Math.max(0,Math.round((new Date("2026-04-28")-new Date())/86400000));
  const urgent=tasks.filter(t=>t.status!=="Complete"&&(t.pri==="Critical"||t.pri==="High")).slice(0,6);
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12}}>
      <SecHead title="Dashboard" sub="Live project progress · auto-saves to browser"/>
      <div style={{background:B.dk,color:B.lt,padding:"10px 16px",borderRadius:12,textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:24,fontWeight:700,lineHeight:1}}>{dLeft}</div>
        <div style={{fontSize:10,marginTop:2}}>days left</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {[{l:"Progress",v:`${pct}%`,s:`${tasks.length} tasks`,c:B.md},{l:"Complete",v:done,s:"finished",c:"#1A5C2A"},{l:"In Progress",v:inp,s:"active",c:"#7A5000"},{l:"Not Started",v:ns,s:"pending",c:"#8B1A1A"}].map((k,i)=>
        <Card key={i} style={{padding:"14px 16px"}}>
          <div style={{fontSize:10,color:B.tg,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{k.l}</div>
          <div style={{fontSize:26,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:10,color:B.tg,marginTop:3}}>{k.s}</div>
        </Card>
      )}
    </div>
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontWeight:700,fontSize:13,color:B.dk}}>Overall Completion</span><span style={{fontWeight:700,color:B.md}}>{pct}%</span></div>
      <Pbar pct={pct} h={12} done={pct===100}/>
      <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap"}}>
        {[["Complete",done,"#C6EFCE","#1A5C2A"],["In Progress",inp,"#FFF3CD","#7A5000"],["Not Started",ns,"#FFE0E0","#8B1A1A"]].map(([l,n,bg,fg])=>
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:3,background:bg,border:`1px solid ${fg}`}}/><span style={{fontSize:11,color:B.tg}}>{l}: <b style={{color:fg}}>{n}</b></span>
          </div>
        )}
      </div>
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>🔴 High Priority Tasks</div>
      {urgent.length===0?<div style={{fontSize:13,color:"#1A5C2A",textAlign:"center",padding:16}}>🎉 All high priority tasks done!</div>
        :urgent.map(t=><div key={t.id} onClick={()=>onNav("tasks")} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${B.st}`,cursor:"pointer"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:t.pri==="Critical"?B.dk:B.ac,flexShrink:0}}/>
          <div style={{flex:1,fontSize:12,lineHeight:1.3}}>{t.desc}</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}><Badge label={t.status} small/><span style={{fontSize:10,color:B.tg}}>{fmtDate(t.end)}</span></div>
        </div>)
      }
    </Card>
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:14}}>👥 Team Workload</div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
        {TEAM.map(m=>{
          const mt=tasks.filter(t=>t.owner===m.id);const mp=calcPct(mt);
          return<div key={m.id} onClick={()=>onNav("team")} style={{textAlign:"center",padding:"12px 10px",background:B.st,borderRadius:12,minWidth:90,flexShrink:0,cursor:"pointer"}}>
            <Avatar name={m.name} area={m.area} size={36}/>
            <div style={{fontSize:11,fontWeight:600,color:B.dk,marginTop:7}}>{m.name.split(" ")[0]}</div>
            <div style={{fontSize:9,color:B.tg,marginTop:2}}>{mt.length} tasks</div>
            <Pbar pct={mp} h={4} style={{marginTop:6}}/><div style={{fontSize:10,color:B.md,fontWeight:600,marginTop:3}}>{mp}%</div>
          </div>;
        })}
      </div>
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// TASK TRACKER
// ════════════════════════════════════════════════════════════
function TaskTracker({tasks,setTasks,setToast,isMobile}){
  const[modal,setModal]=useState(null);
  const[filter,setFilter]=useState("All");
  const visible=filter==="All"?tasks:tasks.filter(t=>t.status===filter);
  function handleSave(saved){
    if(!saved.id){const nid=tasks.length?Math.max(...tasks.map(t=>t.id))+1:1;setTasks(ts=>[...ts,{...saved,id:nid}]);setToast("✓ Task added");}
    else{setTasks(ts=>ts.map(t=>t.id===saved.id?saved:t));setToast(`✓ Task #${saved.id} updated`);}
    setModal(null);
  }
  function handleDelete(id){if(!window.confirm(`Delete task #${id}?`))return;setTasks(ts=>ts.filter(t=>t.id!==id));setModal(null);setToast("Task deleted");}
  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:10}}>
      <SecHead title="Tasks" sub="Tap any card to edit · changes sync to Gantt & RACI"/>
      <button onClick={()=>setModal({desc:"",start:"2026-04-06",end:"2026-04-07",status:"Not Started",pri:"High",owner:TEAM[0].id,pct:0,deps:"",notes:""})}
        style={{background:B.dk,color:"#fff",padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",flexShrink:0}}>+ Add</button>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
      {["All","Complete","In Progress","Not Started"].map(s=>
        <button key={s} onClick={()=>setFilter(s)} style={{padding:"7px 14px",borderRadius:99,border:`1.5px solid ${filter===s?B.ac:B.pl}`,background:filter===s?B.pl:"transparent",color:filter===s?B.md:B.tg,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>{s}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {visible.map(t=>{
        const m=memberObj(t.owner);const isMile=t.id===17;
        return<div key={t.id} onClick={()=>setModal(t)} style={{background:B.wh,borderRadius:14,border:`1px solid ${t.updatedAt&&Date.now()-t.updatedAt<60000?"#F0C040":B.pl}`,padding:"14px 16px",cursor:"pointer",borderLeft:`4px solid ${t.pri==="Critical"?B.dk:t.pri==="High"?B.ac:"transparent"}`}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
            <span style={{fontSize:11,color:B.tg,fontWeight:600,minWidth:20,paddingTop:2}}>#{t.id}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:isMile?700:600,color:isMile?B.dk:B.tx,lineHeight:1.3}}>{isMile?"⭐ ":""}{t.desc}</div>{t.notes&&<div style={{fontSize:11,color:B.tg,marginTop:3,lineHeight:1.4}}>{t.notes}</div>}</div>
            <span style={{color:B.ac,fontSize:16,flexShrink:0}}>›</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <Avatar name={m.name} area={m.area} size={22}/><span style={{fontSize:12,color:B.tm}}>{m.name.split(" ")[0]}</span>
            <span style={{fontSize:11,color:B.tg,marginLeft:"auto"}}>{fmtDate(t.start)} → {fmtDate(t.end)}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <Badge label={t.status}/><PriBadge label={t.pri}/>
            <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}><Pbar pct={t.pct} done={t.pct===100}/><span style={{fontSize:11,color:B.tg,minWidth:30}}>{t.pct}%</span></div>
          </div>
        </div>;
      })}
    </div>
    {modal!==null&&<TaskModal task={modal} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// GANTT
// ════════════════════════════════════════════════════════════
function GanttChart({tasks,setTasks,setToast,isMobile}){
  const[modal,setModal]=useState(null);
  function handleSave(saved){setTasks(ts=>ts.map(t=>t.id===saved.id?{...saved,updatedAt:Date.now()}:t));setModal(null);setToast(`✓ Task #${saved.id} updated — RACI synced`);}
  function handleDelete(id){setTasks(ts=>ts.filter(t=>t.id!==id));setModal(null);setToast("Task deleted");}
  const barCol=t=>t.id===17?"#FFD700":t.status==="Complete"?B.dk:t.status==="In Progress"?B.ac:B.md;
  if(isMobile){
    return<div>
      <SecHead title="Gantt / Timeline" sub="Tap a task to edit dates & status"/>
      <div style={{background:"#FFF3CD",border:"1px solid #F0C040",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#7A5000"}}>🔗 Editing here syncs to RACI and Dashboard.</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tasks.map(t=>{
          const m=memberObj(t.owner);const bc=barCol(t);const isMile=t.id===17;
          const gl=ganttOffset(t.start);const gw=ganttWidth(t.start,t.end);
          const barPct=Math.min(100,Math.round((gw/GANTT_DAYS)*100));
          const barLeft=Math.min(85,Math.round((gl/GANTT_DAYS)*100));
          return<div key={t.id} onClick={()=>setModal(t)} style={{background:B.wh,borderRadius:12,border:`1px solid ${B.pl}`,padding:"12px 14px",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:10,color:B.tg,minWidth:20}}>#{t.id}</span>
              <span style={{flex:1,fontSize:13,fontWeight:isMile?700:500,color:isMile?B.dk:B.tx}}>{isMile?"⭐ ":""}{t.desc}</span>
              <Badge label={t.status} small/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Avatar name={m.name} area={m.area} size={18}/><span style={{fontSize:11,color:B.tg}}>{m.name.split(" ")[0]}</span>
              <span style={{fontSize:11,color:B.tg,marginLeft:"auto"}}>{fmtDate(t.start)} → {fmtDate(t.end)}</span>
            </div>
            <div style={{height:8,borderRadius:99,background:B.st,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",left:`${barLeft}%`,width:`${Math.max(4,barPct)}%`,height:"100%",background:bc,borderRadius:99}}/>
            </div>
          </div>;
        })}
      </div>
      {modal&&<TaskModal task={modal} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
    </div>;
  }
  const days=Array.from({length:GANTT_DAYS},(_,i)=>{const d=new Date("2026-04-06T12:00:00");d.setDate(d.getDate()+i);const isW=d.getDay()===0||d.getDay()===6;const isMile=i===22;return{i,isW,isMile,lbl:isMile?"28⭐":d.getMonth()===4?`${d.getDate()}/5`:String(d.getDate())};});
  return<div>
    <SecHead title="Gantt Chart" sub="6 April – 8 May 2026 · ⭐ = Event Day · Click task name to edit — syncs to RACI"/>
    <div style={{background:"#FFF3CD",border:"1px solid #F0C040",borderRadius:10,padding:"9px 14px",marginBottom:14,fontSize:12,color:"#7A5000",display:"flex",alignItems:"center",gap:8}}>
      🔗 <span>Editing any task here automatically updates the <b>RACI matrix</b>, <b>Dashboard</b> and <b>Final Report</b>.</span>
    </div>
    <div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${B.pl}`}}>
      <table style={{borderCollapse:"collapse",minWidth:900,width:"100%",tableLayout:"fixed"}}>
        <colgroup><col style={{width:28}}/><col style={{width:200}}/><col style={{width:80}}/>{days.map((_,i)=><col key={i} style={{width:`${100/GANTT_DAYS}%`}}/>)}</colgroup>
        <thead>
          <tr><th colSpan={3} style={{background:B.dk,padding:"8px 12px",textAlign:"left",color:B.pl,fontSize:10,fontWeight:700}}>Task</th><th colSpan={GANTT_DAYS} style={{background:B.dk,padding:"8px 6px",textAlign:"center",color:B.lt,fontSize:10,fontWeight:700}}>April 2026 → May 2026</th></tr>
          <tr style={{background:B.dk}}>{["#","Task","Owner"].map(h=><th key={h} style={{padding:"6px 10px",color:B.pl,fontSize:10,fontWeight:700,textAlign:"left"}}>{h}</th>)}{days.map(d=><th key={d.i} style={{padding:"4px 1px",textAlign:"center",fontSize:d.isMile?9:8,fontWeight:d.isMile?700:600,color:d.isW?"rgba(116,198,157,.7)":d.isMile?"#FFD700":B.pl,background:d.isW?"rgba(0,0,0,.18)":B.dk,borderLeft:d.isMile?"2px solid rgba(255,215,0,.4)":undefined}}>{d.lbl}</th>)}</tr>
        </thead>
        <tbody>
          {tasks.map((t,ri)=>{
            const m=memberObj(t.owner);const gl=ganttOffset(t.start);const gw=ganttWidth(t.start,t.end);const bc=barCol(t);const bg=ri%2===0?B.wh:B.st;const isRecent=t.updatedAt&&Date.now()-t.updatedAt<60000;
            return<tr key={t.id} style={{background:isRecent?"#FFFBEA":bg,outline:isRecent?"2px solid #F0C040":"none"}}>
              <td style={{padding:"5px 10px",fontSize:10,color:B.tg,fontWeight:600}}>{t.id}</td>
              <td style={{padding:"5px 10px",cursor:"pointer"}} onClick={()=>setModal(t)}>
                <div style={{fontSize:11,fontWeight:t.id===17?700:400,color:t.id===17?B.dk:B.tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{isRecent&&<span style={{fontSize:9,color:"#7A5000",marginRight:4}}>✦</span>}{t.id===17?"⭐ ":""}{t.desc}</div>
                <div style={{fontSize:9,color:B.tg}}>{fmtDate(t.start)} → {fmtDate(t.end)}</div>
              </td>
              <td style={{padding:"5px 10px",fontSize:10,color:B.tm,whiteSpace:"nowrap"}}>{m.name.split(" ")[0]}</td>
              {days.map(d=>{const inBar=d.i>=gl&&d.i<gl+gw;const isStart=inBar&&d.i===gl;const isEnd=inBar&&d.i===gl+gw-1;return<td key={d.i} style={{padding:"4px 1px",height:32,textAlign:"center",background:inBar?bc:d.isW?"rgba(116,198,157,.08)":"transparent",borderLeft:d.isMile?"1px dashed rgba(255,215,0,.35)":undefined,borderRadius:isStart?"4px 0 0 4px":isEnd?"0 4px 4px 0":undefined}}>{inBar&&t.id===17&&d.i===gl&&<span style={{fontSize:12}}>⭐</span>}</td>;})}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
      {[["Planned",B.md],["In Progress",B.ac],["Complete",B.dk],["Milestone","#FFD700"],["Weekend","rgba(116,198,157,.15)"],["Just updated","#FFFBEA"]].map(([l,c])=>
        <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:9,borderRadius:2,background:c,border:"1px solid rgba(0,0,0,.1)"}}/><span style={{fontSize:10,color:B.tg}}>{l}</span></div>
      )}
    </div>
    {modal&&<TaskModal task={modal} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// RACI — tick to complete with auto-propagation
// ════════════════════════════════════════════════════════════
function RaciMatrix({tasks,setTasks,raci,setRaci,setToast,isMobile}){
  const[modal,setModal]=useState(null);

  // Mark task complete from RACI — the key new feature
  function toggleTaskDone(taskId){
    const t=tasks.find(x=>x.id===taskId);
    if(!t)return;
    const alreadyDone=t.status==="Complete";
    const newStatus=alreadyDone?"Not Started":"Complete";
    const newPct=alreadyDone?0:100;
    setTasks(ts=>ts.map(x=>x.id===taskId?{...x,status:newStatus,pct:newPct,updatedAt:Date.now()}:x));
    setToast(alreadyDone?`↩ Task #${taskId} marked Not Started`:`✅ Task #${taskId} marked Complete — Gantt & Report updated`);
  }

  function cycleCell(taskId,memberId){
    setRaci(prev=>{const row=prev[taskId]||{};const cur=row[memberId]||"";const next=RACI_CYCLE[(RACI_CYCLE.indexOf(cur)+1)%RACI_CYCLE.length];return{...prev,[taskId]:{...row,[memberId]:next}};});
  }

  async function handleSave(saved){
    const updated={...saved,updatedAt:Date.now()};
    setTasks(ts=>ts.map(t=>t.id===updated.id? updated:t));
    setModal(null);
    setToast(`✓ Task #${saved.id} updated — Gantt & Report synced`);
   try{
    await fetch('/api/update-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});
  }catch(e){console.error(e);}
  }
  
  function handleDelete(id){setTasks(ts=>ts.filter(t=>t.id!==id));setModal(null);setToast("Task deleted");}

  const warns=tasks.filter(t=>{const r=raci[t.id]||{};const v=Object.values(r);return!v.includes("R")||!v.includes("A");});

  return<div>
    <SecHead title="RACI Matrix" sub="Tap ✓ to mark a task complete — auto-updates Gantt, Dashboard & Final Report"/>

    <div style={{background:"#EBF7EE",border:`1px solid ${B.lt}`,borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:12,color:B.md,display:"flex",gap:10,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>💡</span>
      <div>
        <b style={{display:"block",marginBottom:3}}>How to mark actions complete:</b>
        Tap the <span style={{background:"#1A5C2A",color:"#fff",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>✓</span> button at the end of any row to toggle the task between <b>Complete</b> and <b>Not Started</b>. This instantly updates the Gantt bar colour, Dashboard KPIs and Final Report. Use the <b>R/A/C/I cells</b> to adjust responsibility assignments.
      </div>
    </div>

    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {[["R","Responsible","#1A3C2E","#fff"],["A","Accountable","#40916C","#fff"],["C","Consulted","#D8F3DC","#1A3C2E"],["I","Informed","#e4e4e4","#555"]].map(([v,l,bg,fg])=>
        <div key={v} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:B.wh,borderRadius:10,border:`1px solid ${B.pl}`}}>
          <div style={{width:24,height:24,borderRadius:6,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:fg,flexShrink:0}}>{v}</div>
          <div style={{fontSize:11,color:B.dk,fontWeight:600}}>{l}</div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:B.wh,borderRadius:10,border:`1px solid ${B.pl}`}}>
        <div style={{width:24,height:24,borderRadius:6,background:"#1A5C2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>✓</div>
        <div style={{fontSize:11,color:B.dk,fontWeight:600}}>Mark Complete</div>
      </div>
    </div>

    {warns.length>0&&<div style={{background:"#FFF3CD",border:"1px solid #F0C040",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#7A5000"}}>⚠ {warns.length} task{warns.length>1?"s":""} missing R or A: {warns.map(t=>`#${t.id}`).join(", ")}</div>}

    <div style={{overflowX:"auto",background:B.wh,borderRadius:12,border:`1px solid ${B.pl}`,WebkitOverflowScrolling:"touch"}}>
      <table style={{borderCollapse:"collapse",minWidth:isMobile?680:820,width:"100%"}}>
        <thead>
          <tr style={{background:B.dk}}>
            <th style={{padding:"10px 8px",textAlign:"left",color:B.pl,fontSize:10,fontWeight:700,width:28,position:"sticky",left:0,background:B.dk,zIndex:2}}>#</th>
            <th style={{padding:"10px 10px",textAlign:"left",color:B.pl,fontSize:10,fontWeight:700,minWidth:isMobile?120:170,position:"sticky",left:28,background:B.dk,zIndex:2}}>Task</th>
            <th style={{padding:"10px 8px",textAlign:"center",color:B.pl,fontSize:10,fontWeight:700,minWidth:70}}>Status</th>
            <th style={{padding:"10px 8px",textAlign:"center",color:B.pl,fontSize:10,fontWeight:700,minWidth:isMobile?70:100}}>Timeline</th>
            {TEAM.map(m=><th key={m.id} style={{padding:"10px 6px",textAlign:"center",color:B.pl,fontSize:10,fontWeight:700,minWidth:56}}>
              <Avatar name={m.name} area={m.area} size={22}/><div style={{marginTop:3,fontSize:9}}>{m.name.split(" ")[0]}</div>
            </th>)}
            <th style={{padding:"10px 8px",textAlign:"center",color:B.pl,fontSize:10,fontWeight:700,minWidth:52}}>Done</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t,ri)=>{
            const row=raci[t.id]||{};
            const isDone=t.status==="Complete";
            const isRecent=t.updatedAt&&Date.now()-t.updatedAt<60000;
            const bg=isRecent?"#FFFBEA":ri%2===0?B.wh:B.st;
            const hasR=Object.values(row).includes("R");const hasA=Object.values(row).includes("A");
            return<tr key={t.id} style={{background:bg,outline:isRecent?"2px solid #F0C040":"none"}}>
              <td style={{padding:"8px 8px",fontSize:10,color:B.tg,fontWeight:600,position:"sticky",left:0,background:isDone?"#C6EFCE":bg,zIndex:1}}>{t.id}</td>
              <td style={{padding:"8px 10px",position:"sticky",left:28,background:isDone?"#C6EFCE":bg,zIndex:1,cursor:"pointer"}} onClick={()=>setModal(t)}>
                {isRecent&&<div style={{fontSize:8,color:"#7A5000",fontWeight:700,marginBottom:2}}>✦ UPDATED</div>}
                <div style={{fontSize:11,color:isDone?"#1A5C2A":B.tx,lineHeight:1.3,fontWeight:isDone?700:400,textDecoration:isDone?"none":"none"}}>
                  {isDone&&<span style={{marginRight:4}}>✅</span>}{t.id===17?"⭐ ":""}{t.desc}
                </div>
                {(!hasR||!hasA)&&<div style={{fontSize:9,color:"#7A5000"}}>⚠ Missing {!hasR?"R":""}{!hasA&&!hasR?" & ":""}{!hasA?"A":""}</div>}
              </td>
              <td style={{padding:"5px 6px",textAlign:"center",background:isDone?"#C6EFCE":undefined}}>
                <Badge label={t.status} small/><div style={{fontSize:9,color:B.tg,marginTop:3}}>{t.pct}%</div>
              </td>
              <td style={{padding:"5px 8px",background:isDone?"#C6EFCE":undefined}}>
                <div style={{height:6,borderRadius:99,background:B.st,overflow:"hidden",position:"relative",minWidth:isMobile?60:90}}>
                  <div style={{position:"absolute",left:`${Math.min(85,Math.round((ganttOffset(t.start)/GANTT_DAYS)*100))}%`,width:`${Math.max(2,Math.round((ganttWidth(t.start,t.end)/GANTT_DAYS)*100))}%`,height:"100%",background:t.status==="Complete"?B.dk:t.status==="In Progress"?B.ac:B.md,borderRadius:99}}/>
                </div>
                <div style={{fontSize:8,color:B.tg,marginTop:2,textAlign:"center"}}>{fmtDate(t.start)}</div>
              </td>
              {TEAM.map(m=>{
                const v=row[m.id]||"";const rs=RACI_STYLE[v]||RACI_STYLE[""];
                return<td key={m.id} style={{padding:"5px 5px",textAlign:"center",background:isDone?"rgba(198,239,206,.3)":undefined}}>
                  <div onClick={()=>cycleCell(t.id,m.id)} title={`${m.name}: ${v||"unassigned"}`}
                    style={{width:34,height:34,borderRadius:7,margin:"0 auto",background:rs.bg,color:rs.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,cursor:"pointer",border:v?"none":"1.5px dashed #ddd",userSelect:"none",WebkitTapHighlightColor:"transparent",transition:"transform .1s"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    {v||"+"}
                  </div>
                </td>;
              })}
              {/* ── TICK / DONE BUTTON ── */}
              <td style={{padding:"5px 6px",textAlign:"center"}}>
                <div onClick={()=>toggleTaskDone(t.id)} title={isDone?"Click to mark Not Started":"Click to mark Complete"}
                  style={{width:36,height:36,borderRadius:8,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none",WebkitTapHighlightColor:"transparent",transition:"all .2s",
                    background:isDone?"#1A5C2A":"transparent",
                    border:isDone?"2px solid #1A5C2A":"2px dashed #74C69D",
                    boxShadow:isDone?"0 2px 8px rgba(26,92,42,.3)":"none",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";if(!isDone)e.currentTarget.style.background="#D8F3DC";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";if(!isDone)e.currentTarget.style.background="transparent";}}>
                  <span style={{fontSize:16,color:isDone?"#fff":"#74C69D",fontWeight:700,lineHeight:1}}>{isDone?"✓":"✓"}</span>
                </div>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <p style={{fontSize:11,color:B.tg,marginTop:8}}>Tap <b>✓</b> to toggle task complete · updates Gantt, Dashboard & Final Report instantly · scroll right for all columns</p>
    {modal&&<TaskModal task={modal} onSave={handleSave} onDelete={handleDelete} onClose={()=>setModal(null)}/>}
  </div>;
}

// ════════════════════════════════════════════════════════════
// FINAL REPORT — auto-generated from task completion state
// ════════════════════════════════════════════════════════════
function FinalReport({tasks,raci,isMobile}){
  const done=tasks.filter(t=>t.status==="Complete");
  const inp=tasks.filter(t=>t.status==="In Progress");
  const ns=tasks.filter(t=>t.status==="Not Started");
  const pct=calcPct(tasks);
  const allDone=tasks.length>0&&done.length===tasks.length;

  const memberSummary=TEAM.map(m=>{
    const myTasks=tasks.filter(t=>t.owner===m.id);
    const myDone=myTasks.filter(t=>t.status==="Complete");
    const myRaci=tasks.map(t=>{const r=(raci[t.id]||{})[m.id];return r?{task:t,role:r}:null;}).filter(Boolean);
    const accountable=myRaci.filter(x=>x.role==="A"||x.role==="R");
    return{...m,myTasks,myDone,accountable,completion:myTasks.length?Math.round(myDone.length/myTasks.length*100):0};
  });

  const postEventTasks=[18,19];
  const criticalOutstanding=tasks.filter(t=>t.status!=="Complete"&&t.pri==="Critical");

  return<div>
    <SecHead title="Final Report" sub="Auto-generated from task completion — updates live as RACI ticks are applied"/>

    {/* Status banner */}
    <div style={{background:allDone?B.dk:pct>60?"#FFF3CD":"#FFE0E0",borderRadius:14,padding:"18px 22px",marginBottom:16,border:`1px solid ${allDone?B.lt:pct>60?"#F0C040":"#E08080"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:allDone?"#fff":pct>60?"#7A5000":"#8B1A1A",marginBottom:4}}>
            {allDone?"🎉 Event Fully Complete":"📋 Report in Progress — "+pct+"% of tasks complete"}
          </div>
          <div style={{fontSize:12,color:allDone?B.lt:pct>60?"#7A5000":"#8B1A1A"}}>
            {allDone?"All 19 tasks marked complete. Report is finalised.":`${done.length} of ${tasks.length} tasks complete · ${ns.length} outstanding · tick ✓ on RACI to update`}
          </div>
        </div>
        <div style={{fontSize:32,fontWeight:800,color:allDone?"#fff":pct>60?"#7A5000":"#8B1A1A"}}>{pct}%</div>
      </div>
      {!allDone&&<div style={{marginTop:12}}>
        <div style={{height:8,borderRadius:99,background:"rgba(0,0,0,.1)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:pct>60?"#7A5000":B.dk,borderRadius:99,transition:"width .5s"}}/>
        </div>
      </div>}
    </div>

    {/* Event headline facts */}
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:13}}>📋 Event Summary</div>
      {[["Event","Oxford-Style Debate — Northumbria Construct"],["Date","Monday 28 April 2026"],["Time","3:00pm – 5:00pm"],["Venue","NSU Building – Reds Hall, Northumbria University"],["Organiser","Northumbria Construct Student Society"],["Tasks Total",tasks.length],["Tasks Complete",done.length],["Tasks Remaining",ns.length+inp.length],["Overall Progress",`${pct}%`]].map(([l,v])=>
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.st}`}}>
          <span style={{fontSize:12,color:B.tg}}>{l}</span>
          <span style={{fontSize:12,fontWeight:600,color:typeof v==="number"&&v===done.length&&done.length>0?"#1A5C2A":B.tx}}>{v}</span>
        </div>
      )}
    </Card>

    {/* Completed tasks */}
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>✅ Completed Tasks ({done.length}/{tasks.length})</div>
      {done.length===0
        ?<div style={{fontSize:12,color:B.tg,textAlign:"center",padding:16}}>No tasks marked complete yet. Tick ✓ on the RACI tab to mark tasks done.</div>
        :done.map(t=>{
          const m=memberObj(t.owner);
          return<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${B.st}`}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"#C6EFCE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:12,color:"#1A5C2A",fontWeight:700}}>✓</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:"#1A5C2A",fontWeight:600}}>{t.desc}</div>
              <div style={{fontSize:10,color:B.tg,marginTop:1}}>{t.notes}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <Avatar name={m.name} area={m.area} size={20}/>
              <span style={{fontSize:10,color:B.tg}}>{m.name.split(" ")[0]}</span>
            </div>
          </div>;
        })
      }
    </Card>

    {/* Outstanding tasks */}
    {(inp.length>0||ns.length>0)&&<Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>⏳ Outstanding Tasks ({inp.length+ns.length})</div>
      {[...inp,...ns].map(t=>{
        const m=memberObj(t.owner);
        return<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${B.st}`}}>
          <Badge label={t.status} small/>
          <div style={{flex:1}}><div style={{fontSize:12,color:B.tx,fontWeight:500}}>{t.desc}</div><div style={{fontSize:10,color:B.tg,marginTop:1}}>{fmtDate(t.end)}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><Avatar name={m.name} area={m.area} size={20}/><span style={{fontSize:10,color:B.tg}}>{m.name.split(" ")[0]}</span></div>
        </div>;
      })}
    </Card>}

    {/* Team completion summary */}
    <Card style={{marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:14}}>👥 Team Completion Summary</div>
      {memberSummary.map(m=>(
        <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${B.st}`}}>
          <Avatar name={m.name} area={m.area} size={36}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,fontWeight:600,color:B.dk}}>{m.name.split(" ")[0]}</span>
              <span style={{fontSize:11,color:m.completion===100?"#1A5C2A":B.tg,fontWeight:600}}>{m.myDone.length}/{m.myTasks.length} tasks · {m.completion}%</span>
            </div>
            <Pbar pct={m.completion} h={5} done={m.completion===100}/>
          </div>
        </div>
      ))}
    </Card>

    {/* Post-event actions */}
    <Card>
      <div style={{fontWeight:700,fontSize:14,color:B.dk,marginBottom:12}}>📣 Post-Event Actions</div>
      <div style={{fontSize:12,color:B.tg,marginBottom:12}}>These tasks activate after the event on 28 April:</div>
      {tasks.filter(t=>postEventTasks.includes(t.id)).map(t=>{
        const isDone=t.status==="Complete";
        return<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${B.st}`}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:isDone?"#C6EFCE":"#FFE0E0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:isDone?"#1A5C2A":"#8B1A1A"}}>{isDone?"✓":"○"}</span>
          </div>
          <div style={{flex:1}}><div style={{fontSize:12,color:isDone?"#1A5C2A":B.tx,fontWeight:isDone?600:400}}>{t.desc}</div><div style={{fontSize:10,color:B.tg}}>Due: {fmtDate(t.end)} · Owner: {memberObj(t.owner).name.split(" ")[0]}</div></div>
          <Badge label={t.status} small/>
        </div>;
      })}
      <div style={{marginTop:14,padding:"12px 16px",background:B.st,borderRadius:10,fontSize:12,color:B.tm}}>
        <b style={{color:B.dk,display:"block",marginBottom:6}}>Remaining post-event actions:</b>
        {["Publish LinkedIn event recap article (Kufre Antia — by 1 May)","Share photos and speaker quotes on Northumbria Construct LinkedIn","Collate and analyse feedback form responses (Tolulope Idowu — by 30 Apr)","Send thank-you messages to all speakers and the Debate Chair","Document lessons learned for future events (Tolulope — by 3 May)"].map((a,i)=>
          <div key={i} style={{display:"flex",gap:8,padding:"4px 0"}}>
            <span style={{color:B.ac,flexShrink:0}}>·</span><span>{a}</span>
          </div>
        )}
      </div>
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// TEAM
// ════════════════════════════════════════════════════════════
function Team({tasks,isMobile}){
  const coreRoles=[
    {role:"Project Manager",         resp:"Overall coordination; liaison with NSU",                                       who:"Tolulope Idowu",          status:"Assigned"},
    {role:"Debate Chair / Moderator",resp:"Neutral facilitation; Oxford rules; timekeeping",                              who:"Shortlist: Kelechi Ayanso · Barry Gledson · Michelle Littlemore · Pablo Martinez",status:"Shortlisted"},
    {role:"Proposition Team (2–3)",  resp:"Argue in favour of the motion",                                               who:"Kufre Antia (lead) · Kufre, Lucas, Ikechukwu, Vemula, Judith, Adiyita, Maria",status:"In Selection"},
    {role:"Opposition Team (2–3)",   resp:"Argue against the motion",                                                    who:"Kufre Antia (lead) · TBC",status:"Open"},
    {role:"Logistics Lead",          resp:"Reds Hall, AV, seating, signage",                                             who:"Uchechukwu Maduwuba",     status:"Assigned"},
    {role:"Comms & Engagement",      resp:"Promotion, registration, attendance",                                         who:"All team",                status:"Active"},
  ];
  const stBadge=s=>s==="Assigned"||s==="Active"?{bg:"#C6EFCE",fg:"#1A5C2A"}:s==="Shortlisted"||s==="In Selection"?{bg:"#FFF3CD",fg:"#7A5000"}:{bg:"#FFE0E0",fg:"#8B1A1A"};
  return<div>
    <SecHead title="Team" sub="Northumbria Construct Event Planning Committee"/>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
      {TEAM.map(m=>{
        const mt=tasks.filter(t=>t.owner===m.id);const mp=calcPct(mt);const mc=mt.filter(t=>t.status==="Complete").length;
        return<Card key={m.id} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <Avatar name={m.name} area={m.area} size={46}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:B.dk}}>{m.name}</div>
            <div style={{fontSize:11,color:B.ac,fontWeight:600,marginBottom:5}}>{m.role}</div>
            <div style={{fontSize:11,color:B.tg,lineHeight:1.55}}>{m.resp}</div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,padding:"2px 9px",borderRadius:20,background:B.pl,color:B.md,fontWeight:700}}>{m.area}</span><span style={{fontSize:9,color:B.tg}}>{mc}/{mt.length} tasks complete</span></div>
            <div style={{marginTop:7,display:"flex",alignItems:"center",gap:6}}><Pbar pct={mp} h={5}/><span style={{fontSize:10,color:B.md,fontWeight:600,minWidth:30}}>{mp}%</span></div>
          </div>
        </Card>;
      })}
    </div>
    <Card style={{padding:"0",overflow:"hidden",marginBottom:14}}>
      <div style={{background:B.md,padding:"12px 18px",fontWeight:700,fontSize:14,color:"#fff"}}>Core Delivery Roles</div>
      {coreRoles.map((r,i)=>{const sc=stBadge(r.status);return<div key={i} style={{padding:"12px 18px",background:i%2===0?B.wh:B.st,borderBottom:`1px solid ${B.pl}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><span style={{fontSize:13,fontWeight:700,color:B.dk}}>{r.role}</span><span style={{fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:600,background:sc.bg,color:sc.fg}}>{r.status}</span></div>
        <div style={{fontSize:11,color:B.tm,marginBottom:3}}>{r.resp}</div><div style={{fontSize:11,color:B.tg}}>{r.who}</div>
      </div>;})}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════
export default function App(){
  const isMobile=useIsMobile();
  const[auth,setAuth]=useState(null); // null = logged out
  const[projectName,setProjectName]=useState("Oxford Debate \u00b7 28 April 2026");
  const[tab,setTab]=useState("home");

  const[tasks,setTasks]=useState(DEFAULT_TASKS);
  const[raci,setRaci]=useState(()=>loadState("nc_raci_v2",DEFAULT_RACI));
  const[toast,setToast]=useState("");
  const[saveStatus,setSaveStatus]=useState("idle");
  const[lastSaved,setLastSaved]=useState(null);
  const[hasRemote,setHasRemote]=useState(false);

  // ── Load from server (must be before any early return) ───────────────────
  useEffect(()=>{
    if(!auth)return; // not logged in yet — skip
    async function load(){
      setSaveStatus("loading");
      try{
        const res=await fetch(`/api/state?project_code=${auth.projectCode}`);
        if(!res.ok)throw new Error("unreachable");
        const data=await res.json();
        setHasRemote(true);
        if(data.exists===true&&Array.isArray(data.tasks)&&data.tasks.length>0&&data.tasks[0]?.id!==undefined){
          setTasks(data.tasks);
          if(data.raci&&typeof data.raci==="object"&&!Array.isArray(data.raci))setRaci(data.raci);
          setLastSaved({by:data.savedBy||"",at:data.savedAt||""});
          try{localStorage.setItem("nc_tasks_v2",JSON.stringify(data.tasks));}catch{}
          try{localStorage.setItem("nc_raci_v2",JSON.stringify(data.raci||DEFAULT_RACI));}catch{}
        }
        setSaveStatus("idle");
      }catch{setHasRemote(false);setSaveStatus("idle");}
    }
    load();
  },[auth]);

  useEffect(()=>{try{localStorage.setItem("nc_tasks_v2",JSON.stringify(tasks));}catch{}},[tasks]);
  useEffect(()=>{try{localStorage.setItem("nc_raci_v2",JSON.stringify(raci));}catch{}},[raci]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),3500);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{if(!auth)return;if(!auth.roleDef?.tabs.includes(tab))setTab("home");},[auth]);

  // Show login screen until authenticated
  if(!auth){
    return<LoginScreen
      onLogin={a=>{setAuth(a);setTab("home");}}
      onCreateProject={p=>{
        setProjectName(p.projectName);
        setTasks(p.tasks);
        setAuth({memberId:"creator",memberName:"Project Admin",memberRole:"Admin",role:"admin",roleDef:ROLE_DEFS["admin"]});
        setTab("home");
      }}
    />;
  }

  const roleDef=auth.roleDef;

  // ── Save to server ────────────────────────────────────────────────────────
  async function saveToServer(){
    setSaveStatus("saving");
    const savedAt=new Date().toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    try{
      const res=await fetch("/api/state",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tasks,raci,savedBy:auth.memberName,savedAt,project_code:auth.projectCode}),
      });
      if(!res.ok){const e=await res.json();throw new Error(e.error||"Save failed");}
      setLastSaved({by:auth.memberName,at:savedAt});
      setHasRemote(true);setSaveStatus("saved");
      setToast("\u2601 Saved \u2014 all users will see this when they refresh");
      setTimeout(()=>setSaveStatus("idle"),3000);
    }catch(err){
      setSaveStatus("error");setToast("\u26a0 Save failed \u2014 changes kept locally");
      setTimeout(()=>setSaveStatus("idle"),4000);
    }
  }

  function exportCSV(){
    const hdr=["ID","Task","Owner","Start","End","Status","Priority","% Done","Notes"];
    const rows=tasks.map(t=>[t.id,`"${t.desc}"`,memberObj(t.owner).name,t.start,t.end,t.status,t.pri,t.pct,`"${t.notes}"`]);
    const csv=[hdr,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="NC_Tasks.csv";a.click();
    setToast("\u2b07 CSV exported");
  }

  function exportExcel(){
    // ── Sheet 1: Tasks ──────────────────────────────────────────────────────
    const taskSheet=XLSX.utils.json_to_sheet(tasks.map(t=>({
      "ID":           t.id,
      "Task":         t.desc,
      "Owner":        memberObj(t.owner).name,
      "Owner Role":   memberObj(t.owner).role,
      "Start Date":   t.start,
      "End Date":     t.end,
      "Status":       t.status,
      "Priority":     t.pri,
      "% Done":       t.pct,
      "Dependencies": t.deps,
      "Notes":        t.notes,
    })));
    // Column widths
    taskSheet["!cols"]=[{wch:5},{wch:45},{wch:22},{wch:28},{wch:12},{wch:12},{wch:14},{wch:10},{wch:8},{wch:14},{wch:40}];

    // ── Sheet 2: RACI Matrix ────────────────────────────────────────────────
    const raciRows=tasks.map(t=>{
      const row={"#":t.id,"Task":t.desc.slice(0,60),"Status":t.status};
      TEAM.forEach(m=>{row[m.name.split(" ")[0]]=raci[t.id]?.[m.id]||"";});
      return row;
    });
    const raciSheet=XLSX.utils.json_to_sheet(raciRows);
    raciSheet["!cols"]=[{wch:5},{wch:50},{wch:14},...TEAM.map(()=>({wch:12}))];

    // ── Sheet 3: Team ───────────────────────────────────────────────────────
    const teamSheet=XLSX.utils.json_to_sheet(TEAM.map(m=>({
      "Name":            m.name,
      "Role":            m.role,
      "Area":            m.area,
      "Responsibilities":m.resp,
    })));
    teamSheet["!cols"]=[{wch:24},{wch:32},{wch:12},{wch:80}];

    // ── Sheet 4: Summary ────────────────────────────────────────────────────
    const done=tasks.filter(t=>t.status==="Complete").length;
    const inProg=tasks.filter(t=>t.status==="In Progress").length;
    const summarySheet=XLSX.utils.json_to_sheet([
      {"Metric":"Project","Value":projectName},
      {"Metric":"Exported At","Value":new Date().toLocaleString("en-GB")},
      {"Metric":"Exported By","Value":auth?.memberName||""},
      {"Metric":"Total Tasks","Value":tasks.length},
      {"Metric":"Complete","Value":done},
      {"Metric":"In Progress","Value":inProg},
      {"Metric":"Not Started","Value":tasks.length-done-inProg},
      {"Metric":"Overall Progress","Value":`${tasks.length?Math.round(tasks.reduce((a,t)=>a+t.pct,0)/tasks.length):0}%`},
    ]);
    summarySheet["!cols"]=[{wch:20},{wch:40}];

    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,"Tasks",taskSheet);
    XLSX.utils.book_append_sheet(wb,"RACI Matrix",raciSheet);
    XLSX.utils.book_append_sheet(wb,"Team",teamSheet);
    XLSX.utils.book_append_sheet(wb,"Summary",summarySheet);

    const filename=`${projectName.replace(/[^a-z0-9]/gi,"_")}_Export.xlsx`;
    XLSX.writeFile(wb,filename);
    setToast("\u2b07 Excel exported");
  }

  // ── Save button styles ────────────────────────────────────────────────────
  const saveLabel=saveStatus==="saving"?"Saving\u2026":saveStatus==="saved"?"\u2713 Saved":saveStatus==="error"?"\u26a0 Failed":saveStatus==="loading"?"Loading\u2026":"\u2601 Save";
  const saveBg=saveStatus==="saved"?"#1A5C2A":saveStatus==="error"?"#8B1A1A":"rgba(255,255,255,.12)";
  const saveFg=saveStatus==="saved"?"#74C69D":saveStatus==="error"?"#FFE0E0":saveStatus==="loading"?"rgba(255,255,255,.4)":"#fff";

  // ── Role-filtered tabs ────────────────────────────────────────────────────
  const ALL_TABS=[
    {id:"home",     label:"Home",   icon:"\ud83c\udfe0"},
    {id:"dashboard",label:"Dash",   icon:"\ud83d\udcca"},
    {id:"tasks",    label:"Tasks",  icon:"\u2705"},
    {id:"gantt",    label:"Gantt",  icon:"\ud83d\udcc5"},
    {id:"raci",     label:"RACI",   icon:"\ud83d\udd17"},
    {id:"team",     label:"Team",   icon:"\ud83d\udc65"},
    {id:"report",   label:"Report", icon:"\ud83d\udccb"},
    {id:"edit",     label:"Edit",   icon:"\u270f\ufe0f"},
  ];
  const TABS=ALL_TABS.filter(t=>roleDef.tabs.includes(t.id));

  return<div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:B.st,minHeight:"100vh",color:B.tx,paddingBottom:isMobile?80:0}}>

    {/* ── HEADER ── */}
    <div style={{background:B.dk,padding:`0 ${isMobile?12:20}px`,display:"flex",alignItems:"center",gap:12,height:54,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:B.lt,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:12,fontWeight:700,color:B.dk}}>NC</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#fff",fontWeight:700,fontSize:14,lineHeight:1.1}}>Northumbria Construct</div>
        {!isMobile&&<div style={{color:B.lt,fontSize:10}}>
          {projectName}
          {lastSaved&&<span style={{opacity:.6}}> \u00b7 Saved {lastSaved.at} by {lastSaved.by}</span>}
          {!hasRemote&&saveStatus==="idle"&&<span style={{color:"#F0C040",marginLeft:6}}>\u00b7 local only</span>}
        </div>}
      </div>
      {!isMobile&&<div style={{display:"flex",gap:2}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"5px 11px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,transition:"all .15s",background:tab===t.id?B.lt:"transparent",color:tab===t.id?B.dk:B.pl}}>{t.icon} {t.label}</button>)}
      </div>}
      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
        {/* Role badge */}
        <div style={{padding:"3px 10px",borderRadius:20,background:roleDef.badge,border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{auth.memberName.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
          {!isMobile&&<span style={{fontSize:10,fontWeight:600,color:"#fff"}}>{auth.memberName.split(" ")[0]} \u00b7 {roleDef.label}</span>}
        </div>
        <button onClick={saveToServer} disabled={saveStatus==="saving"||saveStatus==="loading"} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:700,border:"none",cursor:saveStatus==="saving"?"wait":"pointer",background:saveBg,color:saveFg,transition:"all .2s"}}>{saveLabel}</button>
        <button onClick={exportCSV} style={{padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(116,198,157,.2)",color:B.lt,border:"1px solid rgba(116,198,157,.3)",cursor:"pointer"}}>\u2b07 CSV</button>
        <button onClick={()=>setAuth(null)} title="Logout" style={{padding:"5px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",border:"none",cursor:"pointer"}}>\ud83d\udd13</button>
      </div>
    </div>

    {!hasRemote&&saveStatus==="idle"&&<div style={{background:"#FFF3CD",borderBottom:"1px solid #F0C040",padding:"8px 20px",fontSize:12,color:"#7A5000",display:"flex",alignItems:"center",gap:10}}>
      <span>\u26a0</span><span>Shared save not connected \u2014 changes are saving locally only.</span>
    </div>}

    <div style={{maxWidth:1280,margin:"0 auto",padding:isMobile?"16px 14px":"22px 18px"}}>
      {tab==="home"     &&<Home isMobile={isMobile} onNav={setTab} tasks={tasks}/>}
      {tab==="dashboard"&&<Dashboard tasks={tasks} onNav={setTab} isMobile={isMobile}/>}
      {tab==="tasks"    &&<TaskTracker tasks={tasks} setTasks={setTasks} setToast={setToast} isMobile={isMobile}/>}
      {tab==="gantt"    &&<GanttChart tasks={tasks} setTasks={setTasks} setToast={setToast} isMobile={isMobile}/>}
      {tab==="raci"     &&<RaciMatrix tasks={tasks} setTasks={setTasks} raci={raci} setRaci={setRaci} setToast={setToast} isMobile={isMobile}/>}
      {tab==="team"     &&<Team tasks={tasks} isMobile={isMobile}/>}
      {tab==="report"   &&<FinalReport tasks={tasks} raci={raci} isMobile={isMobile}/>}
      {tab==="edit"     &&<TaskUpdater tasks={tasks} setTasks={setTasks} setToast={setToast} canEdit={roleDef.canEdit} canCreate={roleDef.canCreate} projectCode={auth.projectCode}/>}
    </div>

    {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:B.wh,borderTop:`1px solid ${B.pl}`,display:"flex",zIndex:200,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",background:"transparent",padding:"8px 2px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:0}}>
        <span style={{fontSize:16}}>{t.icon}</span>
        <span style={{fontSize:8,fontWeight:700,color:tab===t.id?B.ac:B.tg,lineHeight:1}}>{t.label}</span>
        {tab===t.id&&<div style={{width:16,height:3,borderRadius:99,background:B.ac}}/>}
      </button>)}
      <button onClick={saveToServer} disabled={saveStatus==="saving"||saveStatus==="loading"} style={{position:"absolute",top:-40,right:14,padding:"7px 16px",borderRadius:99,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:saveStatus==="saved"?"#1A5C2A":B.dk,color:saveStatus==="saved"?"#74C69D":"#fff",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>{saveLabel}</button>
    </div>}

    <Toast msg={toast}/>
  </div>;
}
