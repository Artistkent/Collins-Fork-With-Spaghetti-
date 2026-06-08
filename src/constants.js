// ── Brand ─────────────────────────────────────────────────────────────────────
export const B = {
  dk:"#1A3C2E", md:"#2D6A4F", ac:"#40916C", lt:"#74C69D",
  pl:"#D8F3DC", st:"#EBF7EE", tx:"#1C2B22", tm:"#3A5242",
  tg:"#607466", wh:"#FFFFFF",
};

export const STATUS_STYLE = {
  "Complete":    { bg:"#C6EFCE", fg:"#1A5C2A", bd:"#74C69D" },
  "In Progress": { bg:"#FFF3CD", fg:"#7A5000", bd:"#F0C040" },
  "Not Started": { bg:"#FFE0E0", fg:"#8B1A1A", bd:"#E08080" },
};

export const PRI_STYLE = {
  Critical: { bg:"#1A3C2E", fg:"#fff" },
  High:     { bg:"#40916C", fg:"#fff" },
  Medium:   { bg:"#D8F3DC", fg:"#2D6A4F" },
  Low:      { bg:"#f0f0f0", fg:"#555" },
};

export const RACI_CYCLE = ["", "R", "A", "C", "I"];
export const RACI_STYLE = {
  R:  { bg:"#1A3C2E", fg:"#fff" },
  A:  { bg:"#40916C", fg:"#fff" },
  C:  { bg:"#D8F3DC", fg:"#1A3C2E" },
  I:  { bg:"#e4e4e4", fg:"#555" },
  "": { bg:"transparent", fg:"#bbb" },
};

// ── Role definitions ──────────────────────────────────────────────────────────
// admin  — created the project; full access; logs in with project code + admin password
// bucket — logged in via an authority bucket code; sees all tasks, can only write RACI
//          on tasks assigned to their bucket
export const ROLE_DEFS = {
  admin: {
    label: "Admin",
    badge: "#1A3C2E",
    canEditTask: true,   // can edit task fields, dates, etc.
    canDeleteTask: true,
    canManageBuckets: true,
    canWriteRaci: "all", // can write any RACI cell
    tabs: ["brief","dashboard","tasks","gantt","raci","report"],
  },
  bucket: {
    label: "Member",
    badge: "#40916C",
    canEditTask: false,
    canDeleteTask: false,
    canManageBuckets: false,
    canWriteRaci: "own", // can only write RACI on tasks in their bucket
    tabs: ["brief","dashboard","tasks","gantt","raci","report"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function calcPct(tasks){
  return tasks.length ? Math.round(tasks.reduce((s,t) => s + (t.pct||0), 0) / tasks.length) : 0;
}

export function fmtDate(d){
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"short" });
}

export function initials(name){
  return (name||"?").split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase();
}

export function ganttDays(tasks){
  const dates = tasks.flatMap(t => [t.start, t.end]).filter(Boolean).map(d => new Date(d + "T12:00:00"));
  if (!dates.length) return { start: new Date(), count: 30 };
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  min.setDate(min.getDate() - 1);
  max.setDate(max.getDate() + 1);
  const count = Math.max(7, Math.round((max - min) / 86400000) + 1);
  return { start: min, count };
}

export function ganttOffset(ganttStart, dateStr){
  if (!dateStr) return 0;
  return Math.max(0, Math.round((new Date(dateStr + "T12:00:00") - ganttStart) / 86400000));
}

export function ganttWidth(ganttStart, startStr, endStr){
  return Math.max(1, ganttOffset(ganttStart, endStr) - ganttOffset(ganttStart, startStr) + 1);
}
