// api/delete-task.js
// Body: { id, project_code }

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST")    return res.status(405).json({error:"Method not allowed"});

  const { id, project_code } = req.body ?? {};
  if (!id || !project_code) return res.status(400).json({error:"id and project_code required"});

  try {
    await sql`DELETE FROM tasks WHERE id = ${id} AND project_code = ${project_code}`;
    return res.status(200).json({ok:true});
  } catch(err){
    return res.status(500).json({error:"Delete failed",detail:err.message});
  }
}
