// api/login.js
// Handles two login types:
//   admin  — project code + admin password → validated against project_registry
//   bucket — bucket code + member name     → validated against project_buckets
//
// On successful bucket login, records the member name in bucket_members.

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST")    return res.status(405).json({error:"Method not allowed"});

  const { loginType, projectCode, password, bucketCode, memberName } = req.body ?? {};

  // ── Admin login ────────────────────────────────────────────────────────────
  if (loginType === "admin"){
    const code = (projectCode||"").trim().toUpperCase();
    if (!code || !password) return res.status(400).json({error:"projectCode and password required"});
    try {
      const rows = await sql`
        SELECT project_name, admin_password FROM project_registry
        WHERE project_code = ${code}
        LIMIT 1
      `;
      if (rows.length===0) return res.status(401).json({error:"Project not found"});
      if (rows[0].admin_password !== password) return res.status(401).json({error:"Incorrect admin password"});
      return res.status(200).json({ ok:true, projectCode:code, projectName:rows[0].project_name });
    } catch(err){
      return res.status(500).json({error:"Login failed",detail:err.message});
    }
  }

  // ── Bucket login ───────────────────────────────────────────────────────────
  if (loginType === "bucket"){
    const code = (bucketCode||"").trim().toUpperCase();
    const name = (memberName||"").trim();
    if (!code) return res.status(400).json({error:"bucketCode required"});
    if (!name) return res.status(400).json({error:"memberName required"});
    try {
      const rows = await sql`
        SELECT b.id, b.project_code, b.name, b.task_ids,
               r.project_name
        FROM project_buckets b
        JOIN project_registry r ON r.project_code = b.project_code
        WHERE b.code = ${code}
        LIMIT 1
      `;
      if (rows.length===0) return res.status(401).json({error:"Bucket code not found"});
      const bucket = rows[0];

      // Record this member name in bucket_members (idempotent)
      await sql`
        INSERT INTO bucket_members (bucket_id, project_code, member_name, joined_at)
        VALUES (${bucket.id}, ${bucket.project_code}, ${name}, NOW())
        ON CONFLICT (bucket_id, member_name) DO UPDATE SET joined_at = NOW()
      `;

      const taskIds = Array.isArray(bucket.task_ids) ? bucket.task_ids
        : typeof bucket.task_ids === "string" ? JSON.parse(bucket.task_ids || "[]")
        : [];

      return res.status(200).json({
        ok:          true,
        projectCode: bucket.project_code,
        projectName: bucket.project_name,
        bucketId:    bucket.id,
        bucketName:  bucket.name,
        taskIds,
      });
    } catch(err){
      return res.status(500).json({error:"Login failed",detail:err.message});
    }
  }

  return res.status(400).json({error:"loginType must be 'admin' or 'bucket'"});
}
