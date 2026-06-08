// src/utils/exportToExcel.js
// Full project export — one sheet per app tab.
// Call: exportToExcel({ projectName, brief, tasks, buckets, raci })

import { utils, writeFile } from "xlsx";

function pct(tasks){
  return tasks.length ? Math.round(tasks.reduce((s,t) => s+(t.pct||0),0)/tasks.length) : 0;
}

function bucketName(buckets, bucketId){
  return buckets.find(b => b.id === bucketId)?.name || "Unassigned";
}

export function exportToExcel({ projectName, brief, tasks, buckets, raci }){
  const wb   = utils.book_new();
  const date = new Date().toLocaleDateString("en-GB",{ day:"numeric", month:"long", year:"numeric" });

  // ── 1. BRIEF ───────────────────────────────────────────────────────────────
  const ws1 = utils.aoa_to_sheet([
    ["PROJECT BRIEF"],
    [],
    ["Project Name",  projectName || "—"],
    ["Export Date",   date],
    [],
    ["Brief"],
    [brief || "No brief added yet."],
  ]);
  ws1["!cols"] = [{ wch:18 }, { wch:90 }];
  utils.book_append_sheet(wb, ws1, "Brief");

  // ── 2. DASHBOARD ──────────────────────────────────────────────────────────
  const done    = tasks.filter(t => t.status==="Complete").length;
  const inp     = tasks.filter(t => t.status==="In Progress").length;
  const ns      = tasks.filter(t => t.status==="Not Started").length;
  const overall = pct(tasks);
  const urgent  = tasks.filter(t => t.status!=="Complete" && (t.pri==="Critical"||t.pri==="High"));

  const dashRows = [
    ["DASHBOARD SUMMARY"],
    [],
    ["Metric",           "Value"],
    ["Overall Progress", `${overall}%`],
    ["Total Tasks",      tasks.length],
    ["Complete",         done],
    ["In Progress",      inp],
    ["Not Started",      ns],
    ["Authority Buckets",buckets.length],
    ["Team Members",     buckets.reduce((s,b)=>s+(b.members||[]).length,0)],
    [],
    ["HIGH PRIORITY OUTSTANDING"],
    ["ID","Task","Bucket","Priority","Due Date","Status"],
    ...urgent.map(t => [t.id, t.desc, bucketName(buckets,t.bucketId), t.pri, t.end||"—", t.status]),
    [],
    ["BUCKET PROGRESS"],
    ["Bucket","Members","Tasks","Complete","In Progress","Not Started","% Done"],
    ...buckets.map(b => {
      const bt = tasks.filter(t=>t.bucketId===b.id);
      return [
        b.name,
        (b.members||[]).join(", ")||"—",
        bt.length,
        bt.filter(t=>t.status==="Complete").length,
        bt.filter(t=>t.status==="In Progress").length,
        bt.filter(t=>t.status==="Not Started").length,
        `${pct(bt)}%`,
      ];
    }),
  ];
  const ws2 = utils.aoa_to_sheet(dashRows);
  ws2["!cols"] = [{ wch:5 },{ wch:48 },{ wch:22 },{ wch:12 },{ wch:14 },{ wch:14 },{ wch:10 }];
  utils.book_append_sheet(wb, ws2, "Dashboard");

  // ── 3. TASKS ──────────────────────────────────────────────────────────────
  const taskRows = [
    ["ALL TASKS"],
    [],
    ["ID","Description","Bucket","Priority","Start","End","Status","% Done","Notes"],
    ...tasks.map(t => [
      t.id,
      t.desc        || "",
      bucketName(buckets, t.bucketId),
      t.pri         || "Medium",
      t.start       || "—",
      t.end         || "—",
      t.status      || "Not Started",
      `${t.pct||0}%`,
      t.notes       || "",
    ]),
    [],
    ["SUMMARY"],
    ["Total", tasks.length],
    ["Complete",    done],
    ["In Progress", inp],
    ["Not Started", ns],
    ["Overall %",   `${overall}%`],
  ];
  const ws3 = utils.aoa_to_sheet(taskRows);
  ws3["!cols"] = [{ wch:5 },{ wch:50 },{ wch:22 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:14 },{ wch:8 },{ wch:40 }];
  utils.book_append_sheet(wb, ws3, "Tasks");

  // ── 4. BUCKETS ────────────────────────────────────────────────────────────
  const bucketRows = [
    ["AUTHORITY BUCKETS"],
    [],
    ["Bucket Name","Access Code","Members","No. Tasks","Task IDs","Task Descriptions"],
    ...buckets.map(b => {
      const bt = tasks.filter(t=>t.bucketId===b.id);
      return [
        b.name,
        b.code,
        (b.members||[]).join(", ")||"—",
        bt.length,
        bt.map(t=>`#${t.id}`).join(", "),
        bt.map(t=>t.desc).join("; "),
      ];
    }),
    [],
    ["TEAM MEMBERS"],
    ["Name","Bucket","Access Code","Assigned Tasks"],
    ...buckets.flatMap(b =>
      (b.members||[]).length > 0
        ? (b.members||[]).map(m => [
            m, b.name, b.code,
            tasks.filter(t=>t.bucketId===b.id).map(t=>`#${t.id} ${t.desc}`).join("; "),
          ])
        : [["— no members yet", b.name, b.code, tasks.filter(t=>t.bucketId===b.id).map(t=>`#${t.id}`).join(", ")]]
    ),
  ];
  const ws4 = utils.aoa_to_sheet(bucketRows);
  ws4["!cols"] = [{ wch:26 },{ wch:16 },{ wch:30 },{ wch:10 },{ wch:20 },{ wch:70 }];
  utils.book_append_sheet(wb, ws4, "Buckets");

  // ── 5. GANTT ──────────────────────────────────────────────────────────────
  // Represent the gantt as a timeline table with date columns
  const datedTasks = tasks.filter(t=>t.start&&t.end);
  let ganttRows = [["GANTT CHART — TASK TIMELINE"], []];

  if (datedTasks.length === 0){
    ganttRows.push(["No tasks have start/end dates set yet."]);
  } else {
    // Find date range
    const allDates = datedTasks.flatMap(t=>[new Date(t.start+"T12:00:00"), new Date(t.end+"T12:00:00")]);
    const minDate  = new Date(Math.min(...allDates));
    const maxDate  = new Date(Math.max(...allDates));
    const days     = Math.round((maxDate-minDate)/86400000)+1;

    // Build day headers (show every 7th day as label to keep it readable)
    const dayHeaders = Array.from({length:days},(_,i)=>{
      const d = new Date(minDate); d.setDate(d.getDate()+i);
      return i%7===0 ? d.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : "";
    });

    ganttRows.push(["ID","Task","Bucket","Start","End","Duration (days)",...dayHeaders]);

    datedTasks.forEach(t => {
      const tStart   = new Date(t.start+"T12:00:00");
      const tEnd     = new Date(t.end+"T12:00:00");
      const duration = Math.round((tEnd-tStart)/86400000)+1;
      const startOff = Math.round((tStart-minDate)/86400000);
      const endOff   = Math.round((tEnd-minDate)/86400000);

      const bar = Array.from({length:days},(_,i)=>{
        if (i<startOff||i>endOff) return "";
        if (t.status==="Complete")    return "███";
        if (t.status==="In Progress") return "▓▓▓";
        return "░░░";
      });

      ganttRows.push([t.id, t.desc, bucketName(buckets,t.bucketId), t.start, t.end, duration, ...bar]);
    });

    ganttRows.push([]);
    ganttRows.push(["Legend: ███ = Complete · ▓▓▓ = In Progress · ░░░ = Not Started"]);
  }

  const ws5 = utils.aoa_to_sheet(ganttRows);
  ws5["!cols"] = [{ wch:5 },{ wch:40 },{ wch:20 },{ wch:12 },{ wch:12 },{ wch:16 }];
  utils.book_append_sheet(wb, ws5, "Gantt");

  // ── 6. RACI ───────────────────────────────────────────────────────────────
  const raciRows = [
    ["RACI MATRIX"],
    ["R = Responsible · A = Accountable · C = Consulted · I = Informed"],
    [],
  ];

  if (buckets.length === 0){
    raciRows.push(["No authority buckets created yet."]);
  } else {
    raciRows.push(["ID","Task","Status",...buckets.map(b=>b.name)]);
    tasks.forEach(t => {
      const row = raci[t.id]||{};
      raciRows.push([t.id, t.desc, t.status, ...buckets.map(b=>row[b.id]||"")]);
    });

    raciRows.push([]);
    raciRows.push(["RACI COVERAGE SUMMARY"]);
    raciRows.push(["Bucket","R count","A count","C count","I count","Unassigned"]);
    buckets.forEach(b => {
      const vals = tasks.map(t=>(raci[t.id]||{})[b.id]||"");
      raciRows.push([
        b.name,
        vals.filter(v=>v==="R").length,
        vals.filter(v=>v==="A").length,
        vals.filter(v=>v==="C").length,
        vals.filter(v=>v==="I").length,
        vals.filter(v=>v==="").length,
      ]);
    });
  }

  const ws6 = utils.aoa_to_sheet(raciRows);
  ws6["!cols"] = [{ wch:5 },{ wch:50 },{ wch:14 },...buckets.map(()=>({ wch:18 }))];
  utils.book_append_sheet(wb, ws6, "RACI");

  // ── 7. REPORT ─────────────────────────────────────────────────────────────
  const reportRows = [
    ["PROJECT REPORT"],
    [],
    ["Project Name",     projectName||"—"],
    ["Export Date",      date],
    ["Overall Progress", `${overall}%`],
    ["Total Tasks",      tasks.length],
    ["Complete",         done],
    ["In Progress",      inp],
    ["Not Started",      ns],
    [],
    ["PROJECT BRIEF"],
    [brief||"No brief added yet."],
    [],
    ["BUCKET PROGRESS"],
    ["Bucket","Members","Tasks","Complete","In Progress","Not Started","% Done"],
    ...buckets.map(b => {
      const bt = tasks.filter(t=>t.bucketId===b.id);
      return [
        b.name,
        (b.members||[]).join(", ")||"—",
        bt.length,
        bt.filter(t=>t.status==="Complete").length,
        bt.filter(t=>t.status==="In Progress").length,
        bt.filter(t=>t.status==="Not Started").length,
        `${pct(bt)}%`,
      ];
    }),
    [],
    ["COMPLETED TASKS"],
    ["ID","Task","Bucket","Notes"],
    ...tasks.filter(t=>t.status==="Complete").map(t=>[
      t.id, t.desc, bucketName(buckets,t.bucketId), t.notes||""
    ]),
    [],
    ["OUTSTANDING TASKS"],
    ["ID","Task","Bucket","Priority","Due Date","Status","% Done"],
    ...tasks.filter(t=>t.status!=="Complete").map(t=>[
      t.id, t.desc, bucketName(buckets,t.bucketId), t.pri, t.end||"—", t.status, `${t.pct||0}%`
    ]),
  ];
  const ws7 = utils.aoa_to_sheet(reportRows);
  ws7["!cols"] = [{ wch:5 },{ wch:50 },{ wch:22 },{ wch:12 },{ wch:14 },{ wch:14 },{ wch:10 }];
  utils.book_append_sheet(wb, ws7, "Report");

  // ── Download ───────────────────────────────────────────────────────────────
  const safeName = (projectName||"project").replace(/[^a-zA-Z0-9]/g,"-");
  const isoDate  = new Date().toISOString().slice(0,10);
  writeFile(wb, `${safeName}-${isoDate}.xlsx`);
}
