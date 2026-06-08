// api/create-project.js
// Creates a new project record in project_registry.
// Tasks are NOT created here anymore — the admin creates them inside the app.
// Body: { projectCode, projectName, description, adminPassword }

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST")    return res.status(405).json({error:"Method not allowed"});

  const { projectCode, projectName, description, adminPassword } = req.body ?? {};
  if (!projectCode?.trim())   return res.status(400).json({error:"projectCode is required"});
  if (!projectName?.trim())   return res.status(400).json({error:"projectName is required"});
  if (!adminPassword?.trim()) return res.status(400).json({error:"adminPassword is required"});

  const code = projectCode.trim().toUpperCase();

  try {
    const existing = await sql`SELECT 1 FROM project_registry WHERE project_code = ${code} LIMIT 1`;
    if (existing.length > 0) return res.status(409).json({error:`Project code "${code}" already exists.`});

    await sql`
      INSERT INTO project_registry (project_code, project_name, description, admin_password, created_at)
      VALUES (${code}, ${projectName.trim()}, ${description?.trim()||""}, ${adminPassword.trim()}, NOW())
    `;

    return res.status(200).json({ok:true, projectCode:code, projectName:projectName.trim()});
  } catch(err){
    return res.status(500).json({error:"Failed to create project",detail:err.message});
  }
}
