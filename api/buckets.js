// api/buckets.js
// GET    /api/buckets?project_code=X   → list all buckets + their members
// POST   /api/buckets                  → create or update a bucket
// DELETE /api/buckets                  → delete a bucket

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method==="GET"){
    const code = (req.query?.project_code||"").trim().toUpperCase();
    if (!code) return res.status(400).json({error:"project_code required"});
    try {
      const buckets = await sql`
        SELECT b.id, b.name, b.description, b.code, b.color, b.task_ids,
               COALESCE(
                 json_agg(bm.member_name ORDER BY bm.joined_at)
                 FILTER (WHERE bm.member_name IS NOT NULL),
                 '[]'
               ) AS members
        FROM project_buckets b
        LEFT JOIN bucket_members bm ON bm.bucket_id = b.id
        WHERE b.project_code = ${code}
        GROUP BY b.id, b.name, b.description, b.code, b.color, b.task_ids
        ORDER BY b.created_at
      `;
      return res.status(200).json({
        buckets: buckets.map(b => ({
          id:      b.id,
          name:    b.name,
          desc:    b.description || "",
          code:    b.code,
          color:   b.color,
          taskIds: Array.isArray(b.task_ids) ? b.task_ids
                   : JSON.parse(b.task_ids || "[]"),
          members: Array.isArray(b.members) ? b.members : [],
        }))
      });
    } catch(err){
      return res.status(500).json({error:"Failed to load buckets",detail:err.message});
    }
  }

  // ── POST (create or update) ────────────────────────────────────────────────
  if (req.method==="POST"){
    const { projectCode, bucket } = req.body ?? {};
    if (!projectCode || !bucket) return res.status(400).json({error:"projectCode and bucket required"});
    const code = projectCode.trim().toUpperCase();
    const { id, name, desc, code:bCode, color, taskIds } = bucket;
    if (!name || !bCode) return res.status(400).json({error:"bucket name and code required"});
    try {
      await sql`
        INSERT INTO project_buckets (id, project_code, name, description, code, color, task_ids, created_at)
        VALUES (${id}, ${code}, ${name}, ${desc||""}, ${bCode}, ${color||"#40916C"}, ${JSON.stringify(taskIds||[])}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name        = EXCLUDED.name,
          description = EXCLUDED.description,
          code        = EXCLUDED.code,
          color       = EXCLUDED.color,
          task_ids    = EXCLUDED.task_ids
      `;
      return res.status(200).json({ok:true});
    } catch(err){
      return res.status(500).json({error:"Failed to save bucket",detail:err.message});
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method==="DELETE"){
    const { projectCode, bucketId } = req.body ?? {};
    if (!projectCode || !bucketId) return res.status(400).json({error:"projectCode and bucketId required"});
    try {
      await sql`DELETE FROM bucket_members   WHERE bucket_id = ${bucketId}`;
      await sql`DELETE FROM project_buckets  WHERE id = ${bucketId}`;
      return res.status(200).json({ok:true});
    } catch(err){
      return res.status(500).json({error:"Failed to delete bucket",detail:err.message});
    }
  }

  return res.status(405).json({error:"Method not allowed"});
}
