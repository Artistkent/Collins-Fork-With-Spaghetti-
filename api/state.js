// api/state.js — load and save all tasks + RACI for a project
// GET  /api/state?project_code=X
// POST /api/state { project_code, tasks, raci, savedBy, savedAt }

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method==="GET"){
    const code = (req.query?.project_code||"").trim().toUpperCase();
    if (!code) return res.status(400).json({error:"project_code required"});
    try {
      const tasks    = await sql`SELECT * FROM tasks WHERE project_code = ${code} ORDER BY id`;
      const raciRows = await sql`SELECT data, saved_by, saved_at FROM raci_state WHERE project_code = ${code}`;

      if (tasks.length===0) return res.status(200).json({exists:false});

      const raci    = raciRows.length>0 ? JSON.parse(raciRows[0].data||"{}") : {};
      const savedBy = raciRows[0]?.saved_by ?? "";
      const savedAt = raciRows[0]?.saved_at ?? "";
      const mapped  = tasks.map(t => ({
        id:        t.id,
        desc:      t.description,
        bucketId:  t.bucket_id || null,
        start:     t.start_date,
        end:       t.end_date,
        status:    t.status,
        pri:       t.priority,
        notes:     t.notes,
        pct:       t.pct,
        updatedAt: t.updated_at,
      }));
      return res.status(200).json({exists:true, tasks:mapped, raci, savedBy, savedAt});
    } catch(err){
      console.error("GET error:", err.message);
      return res.status(500).json({error:"Failed to load", detail:err.message});
    }
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method==="POST"){
    const { tasks, raci, savedBy, savedAt, project_code:code } = req.body ?? {};
    if (!code)                 return res.status(400).json({error:"project_code required"});
    if (!Array.isArray(tasks)) return res.status(400).json({error:"tasks array required"});
    try {
      for (const t of tasks){
        await sql`
          INSERT INTO tasks (id, project_code, description, bucket_id,
            start_date, end_date, status, priority, notes, pct, updated_at)
          VALUES (
            ${t.id}, ${code}, ${t.desc||""}, ${t.bucketId||t.bucket_id||null},
            ${t.start||null}, ${t.end||null}, ${t.status||"Not Started"},
            ${t.pri||"Medium"}, ${t.notes||""}, ${t.pct||0}, ${t.updatedAt||null}
          )
          ON CONFLICT (id, project_code) DO UPDATE SET
            description = EXCLUDED.description,
            bucket_id   = EXCLUDED.bucket_id,
            start_date  = EXCLUDED.start_date,
            end_date    = EXCLUDED.end_date,
            status      = EXCLUDED.status,
            priority    = EXCLUDED.priority,
            notes       = EXCLUDED.notes,
            pct         = EXCLUDED.pct,
            updated_at  = EXCLUDED.updated_at
        `;
      }
      await sql`
        INSERT INTO raci_state (project_code, data, saved_by, saved_at)
        VALUES (${code}, ${JSON.stringify(raci||{})}, ${savedBy||""}, ${savedAt||""})
        ON CONFLICT (project_code) DO UPDATE SET
          data     = EXCLUDED.data,
          saved_by = EXCLUDED.saved_by,
          saved_at = EXCLUDED.saved_at
      `;
      return res.status(200).json({ok:true});
    } catch(err){
      console.error("POST error:", err.message);
      return res.status(500).json({error:"Failed to save", detail:err.message});
    }
  }

  return res.status(405).json({error:"Method not allowed"});
}