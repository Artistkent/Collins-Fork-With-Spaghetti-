// api/update-task.js — upsert a single task
// Body: task object with project_code

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST")    return res.status(405).json({error:"Method not allowed"});
  try {
    const t = req.body;
    const code = (t.project_code||"").trim().toUpperCase();
    if (!code || !t.id) return res.status(400).json({error:"project_code and id required"});
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
    return res.status(200).json({ok:true});
  } catch(err){
    return res.status(500).json({error:"Failed to update",detail:err.message});
  }
}
