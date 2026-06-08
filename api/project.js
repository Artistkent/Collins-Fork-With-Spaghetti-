// api/project.js
// GET  /api/project?project_code=X  → returns project metadata including brief
// POST /api/project                 → updates the brief field

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();

  if (req.method==="GET"){
    const code = (req.query?.project_code||"").trim().toUpperCase();
    if (!code) return res.status(400).json({error:"project_code required"});
    try {
      const rows = await sql`
        SELECT project_code, project_name, description, brief
        FROM project_registry WHERE project_code = ${code} LIMIT 1
      `;
      if (rows.length===0) return res.status(404).json({error:"Project not found"});
      return res.status(200).json({project: rows[0]});
    } catch(err){
      return res.status(500).json({error:"Failed to load project",detail:err.message});
    }
  }

  if (req.method==="POST"){
    const { projectCode, brief } = req.body ?? {};
    const code = (projectCode||"").trim().toUpperCase();
    if (!code) return res.status(400).json({error:"projectCode required"});
    try {
      await sql`
        UPDATE project_registry SET brief = ${brief||""} WHERE project_code = ${code}
      `;
      return res.status(200).json({ok:true});
    } catch(err){
      return res.status(500).json({error:"Failed to save brief",detail:err.message});
    }
  }

  return res.status(405).json({error:"Method not allowed"});
}
