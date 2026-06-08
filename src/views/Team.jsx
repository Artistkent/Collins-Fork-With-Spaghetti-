import { B, calcPct, memberObj } from "../constants.js";
import { Card, SecHead, Avatar, Pbar } from "../components/primitives.jsx";

export function Team({ tasks, team, isMobile }){
  const coreRoles = [
    { role:"Project Manager",        resp:"Overall coordination; liaison with NSU",                                      who:"Tolulope Idowu",          status:"Assigned"    },
    { role:"Debate Chair / Moderator",resp:"Neutral facilitation; Oxford rules; timekeeping",                             who:"Shortlist: Kelechi Ayanso · Barry Gledson · Michelle Littlemore · Pablo Martinez", status:"Shortlisted" },
    { role:"Proposition Team (2–3)", resp:"Argue in favour of the motion",                                               who:"Kufre Antia (lead) · Kufre, Lucas, Ikechukwu, Vemula, Judith, Adiyita, Maria", status:"In Selection" },
    { role:"Opposition Team (2–3)",  resp:"Argue against the motion",                                                    who:"Kufre Antia (lead) · TBC", status:"Open"       },
    { role:"Logistics Lead",         resp:"Reds Hall, AV, seating, signage",                                             who:"Uchechukwu Maduwuba",     status:"Assigned"    },
    { role:"Comms & Engagement",     resp:"Promotion, registration, attendance",                                          who:"All team",                status:"Active"      },
  ];
  const stBadge = s => s==="Assigned"||s==="Active"?{bg:"#C6EFCE",fg:"#1A5C2A"}:s==="Shortlisted"||s==="In Selection"?{bg:"#FFF3CD",fg:"#7A5000"}:{bg:"#FFE0E0",fg:"#8B1A1A"};

  return (
    <div>
      <SecHead title="Team" sub="Northumbria Construct Event Planning Committee"/>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
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

      <Card style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
        <div style={{ background:B.md, padding:"12px 18px", fontWeight:700, fontSize:14, color:"#fff" }}>Core Delivery Roles</div>
        {coreRoles.map((r,i) => {
          const sc = stBadge(r.status);
          return (
            <div key={i} style={{ padding:"12px 18px", background:i%2===0?B.wh:B.st, borderBottom:`1px solid ${B.pl}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:13, fontWeight:700, color:B.dk }}>{r.role}</span>
                <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, fontWeight:600, background:sc.bg, color:sc.fg }}>{r.status}</span>
              </div>
              <div style={{ fontSize:11, color:B.tm, marginBottom:3 }}>{r.resp}</div>
              <div style={{ fontSize:11, color:B.tg }}>{r.who}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
