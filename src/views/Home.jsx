import { useState } from "react";
import { B, calcPct, fmtDate, memberObj, GANTT_DAYS, ganttOffset, ganttWidth } from "../constants.js";
import { Card, SecHead, Avatar, Badge, Pbar } from "../components/primitives.jsx";

// ── Project Brief ─────────────────────────────────────────────────────────────
function HomeBrief({ isMobile, onNav }){
  const motions = [
    { n:1, m:"This House Believes That Professional Body Membership Is No Longer Essential for Career Progression in Construction.",   f:"CIOB, ICE, APM relevance; employability; chartership" },
    { n:2, m:"This House Believes That Sustainability Targets Are Undermining Project Delivery Efficiency.",                           f:"ESG requirements, carbon targets, cost and programme pressures" },
    { n:3, m:"This house questions if construction graduates emerge fully industry-ready from universities.",                          f:"Curriculum relevance, graduate readiness, employability gap" },
    { n:4, m:"This house examines the extent to which university education equips construction graduates for modern industry expectations.", f:"Curriculum relevance, industry alignment, graduate competency" },
    { n:5, m:"This House Believes That Universities Are Failing to Prepare Construction Graduates for Industry.",                     f:"Employability gap, industry readiness, curriculum reform" },
  ];
  const fmt = [
    { seg:"Welcome & Introduction",   dur:"5 mins",   detail:"President opens — Northumbria Construct intro & housekeeping" },
    { seg:"Chair's Introduction",     dur:"5 mins",   detail:"Motion, Oxford rules and timing protocol" },
    { seg:"Pre-Debate Audience Vote", dur:"2–3 mins", detail:"Digital QR code vote before arguments" },
    { seg:"Proposition Opening",      dur:"10 mins",  detail:"2 speakers × 5 mins — IN FAVOUR (alternating)" },
    { seg:"Opposition Opening",       dur:"10 mins",  detail:"2 speakers × 5 mins — AGAINST" },
    { seg:"Moderated Q&A / Debate",   dur:"25 mins",  detail:"Chair facilitates; audience selected by Chair" },
    { seg:"Closing Statements",       dur:"6 mins",   detail:"1 speaker per side × 3 mins" },
    { seg:"Post-Debate Vote",         dur:"2–3 mins", detail:"Audience re-votes; winner determined by swing" },
    { seg:"Result & Networking",      dur:"10–15 mins",detail:"Chair announces result; informal engagement" },
  ];
  return (
    <div>
      <div style={{ background:B.dk, borderRadius:16, padding:isMobile?"20px 18px":"28px 32px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-120, right:-120, width:380, height:380, borderRadius:"50%", border:"2px solid rgba(116,198,157,.12)" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:11, fontWeight:700, color:B.lt, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Northumbria Construct · APM Challenge</div>
          <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, color:"#fff", margin:"0 0 8px", lineHeight:1.2 }}>Oxford-Style Debate Event</h1>
          <div style={{ fontSize:14, color:B.lt, marginBottom:16 }}>NSU Building – Reds Hall · 28 April 2026 · ~30 Students</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["📅","28 April"],["🕒","3pm–5pm"],["📍","Reds Hall"],["🎓","~30 Attendees"],["✅","Free Entry"]].map(([ic,lbl])=>
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.1)", borderRadius:99, padding:"5px 12px" }}>
                <span style={{ fontSize:13 }}>{ic}</span><span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{lbl}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:15, color:B.dk, marginBottom:10 }}>📄 Project Brief</div>
        <div style={{ fontSize:13, color:B.tm, lineHeight:1.75 }}>
          Northumbria Construct is organising a formal <b style={{ color:B.dk }}>Oxford-Style Debate</b> as a high-value academic and professional development event for students of the Built Environment Faculty at Northumbria University, on <b style={{ color:B.dk }}>Monday 28 April 2026, 3:00pm–5:00pm</b>, Reds Hall.
        </div>
      </Card>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:15, color:B.dk, marginBottom:10 }}>🎯 Aims & Objectives</div>
        {[
          ["Build professional skills","Develop confidence in public speaking, structured argumentation and professional discourse."],
          ["Stimulate critical thinking","Encourage intellectual engagement particularly during the examination period."],
          ["Industry relevance","Expose students to contemporary issues affecting the built environment and professional practice."],
          ["Society mission","Deliver a high-engagement, low-cost event aligned with Northumbria Construct's mission."],
          ["Visibility & growth","Increase awareness and participation of Northumbria Construct within the student body."],
        ].map(([t,d],i) => (
          <div key={t} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<4?`1px solid ${B.st}`:"none", alignItems:"flex-start" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:B.dk, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:800, color:B.lt }}>{i+1}</span>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:B.dk, marginBottom:2 }}>{t}</div>
              <div style={{ fontSize:12, color:B.tm, lineHeight:1.5 }}>{d}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:15, color:B.dk, marginBottom:4 }}>🎙 Debate Motions</div>
        <div style={{ fontSize:12, color:B.tg, marginBottom:12 }}>5 motions available — one to be selected by the committee.</div>
        {motions.map(({n,m,f}) => (
          <div key={n} style={{ display:"flex", gap:12, padding:"11px 0", borderBottom:n<5?`1px solid ${B.st}`:"none", alignItems:"flex-start" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:B.dk, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:"#fff", flexShrink:0 }}>{n}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:B.dk, marginBottom:3, lineHeight:1.4 }}>"{m}"</div>
              <div style={{ fontSize:11, color:B.tg }}>{f}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:15, color:B.dk, marginBottom:4 }}>⏱ Event Format — 75–90 Minutes</div>
        {fmt.map(({seg,dur,detail},i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<fmt.length-1?`1px solid ${B.st}`:"none" }}>
            <div style={{ flexShrink:0, width:56, textAlign:"center", background:B.dk, borderRadius:8, padding:"4px 6px" }}>
              <span style={{ fontSize:10, fontWeight:700, color:B.lt }}>{dur}</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:B.tx }}>{seg}</div>
              <div style={{ fontSize:11, color:B.tg, marginTop:1 }}>{detail}</div>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={()=>onNav("dashboard")} style={{ flex:1, minWidth:140, background:B.dk, color:"#fff", padding:13, borderRadius:12, fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>View Dashboard →</button>
        <button onClick={()=>onNav("tasks")}     style={{ flex:1, minWidth:140, background:B.pl, color:B.dk,  padding:13, borderRadius:12, fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>Open Tasks →</button>
      </div>
    </div>
  );
}

// ── Home wrapper ──────────────────────────────────────────────────────────────
export function Home({ isMobile, onNav, tasks, team }){
  const [subPage, setSubPage] = useState("brief");
  const subPages = [
    { id:"brief", label:"Project Brief", icon:"📄" },
    { id:"team",  label:"Project Team",  icon:"👥" },
  ];
  return (
    <div>
      <div style={{ display:"flex", gap:0, marginBottom:20, borderBottom:`2px solid ${B.pl}`, overflowX:"auto" }}>
        {subPages.map(p => (
          <button key={p.id} onClick={()=>setSubPage(p.id)} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:isMobile?"10px 12px":"11px 18px",
            border:"none", borderBottom:`3px solid ${subPage===p.id?B.ac:"transparent"}`,
            marginBottom:"-2px", background:"transparent",
            color:subPage===p.id?B.dk:B.tg,
            fontSize:isMobile?11:12, fontWeight:subPage===p.id?800:600,
            cursor:"pointer", flexShrink:0, whiteSpace:"nowrap", transition:"color .15s",
          }}>
            <span>{p.icon}</span><span>{p.label}</span>
          </button>
        ))}
      </div>
      {subPage==="brief" && <HomeBrief isMobile={isMobile} onNav={onNav}/>}
      {subPage==="team"  && <HomeTeam tasks={tasks} team={team} isMobile={isMobile}/>}
    </div>
  );
}

function HomeTeam({ tasks, team, isMobile }){
  return (
    <div>
      <SecHead title="Project Team" sub="Northumbria Construct planning committee"/>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {team.map(m => {
          const mt = tasks.filter(t=>t.owner===m.id);
          const mp = calcPct(mt);
          const mc = mt.filter(t=>t.status==="Complete").length;
          return (
            <Card key={m.id} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <Avatar name={m.name} area={m.area} size={46}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:B.dk }}>{m.name}</div>
                <div style={{ fontSize:11, color:B.ac, fontWeight:600, marginBottom:5 }}>{m.role}</div>
                {m.resp && <div style={{ fontSize:11, color:B.tg, lineHeight:1.55 }}>{m.resp}</div>}
                <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:9, padding:"2px 9px", borderRadius:20, background:B.pl, color:B.md, fontWeight:700 }}>{m.area}</span>
                  <span style={{ fontSize:9, color:B.tg }}>{mc}/{mt.length} tasks complete</span>
                </div>
                <div style={{ marginTop:7, display:"flex", alignItems:"center", gap:6 }}>
                  <Pbar pct={mp} h={5}/><span style={{ fontSize:10, color:B.md, fontWeight:600, minWidth:30 }}>{mp}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
