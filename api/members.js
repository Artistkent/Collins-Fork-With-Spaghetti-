// api/members.js
// Manages project members stored in Neon.
// Table schema:
//   CREATE TABLE project_members (
//     project_code TEXT NOT NULL,
//     member_id    TEXT NOT NULL,
//     name         TEXT NOT NULL,
//     role         TEXT NOT NULL,
//     area         TEXT DEFAULT 'Other',
//     resp         TEXT DEFAULT '',
//     system_role  TEXT NOT NULL DEFAULT 'member',
//     password     TEXT NOT NULL,
//     created_at   TIMESTAMPTZ DEFAULT NOW(),
//     PRIMARY KEY (project_code, member_id)
//   );
//
// Deploy to: /api/members  (Vercel serverless function)
// Required env var: DATABASE_URL

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: list members for a project ────────────────────────────────────────
  if (req.method === 'GET') {
    const code = req.query?.project_code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'project_code required' });
    try {
      const rows = await sql`
        SELECT member_id as id, name, role, area, resp, system_role
        FROM project_members
        WHERE project_code = ${code}
        ORDER BY
          CASE system_role WHEN 'admin' THEN 0 WHEN 'pm' THEN 1 WHEN 'member' THEN 2 WHEN 'raci_only' THEN 3 ELSE 4 END,
          name
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Project not found or has no members' });
      return res.status(200).json({
        members: rows.map(r => ({
          id:         r.id,
          name:       r.name,
          role:       r.role,
          area:       r.area || 'Other',
          resp:       r.resp || '',
          systemRole: r.system_role,
        }))
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load members', detail: err.message });
    }
  }

  // ── POST: add or update a member ───────────────────────────────────────────
  if (req.method === 'POST') {
    const { projectCode, id, name, role, area, resp, systemRole, password, isEdit } = req.body ?? {};
    if (!projectCode || !id || !name || !role || !systemRole) {
      return res.status(400).json({ error: 'projectCode, id, name, role, systemRole are required' });
    }
    if (!isEdit && !password?.trim()) {
      return res.status(400).json({ error: 'password is required for new members' });
    }
    const code = projectCode.trim().toUpperCase();
    try {
      if (isEdit) {
        // Update — only change password if a new one is provided
        if (password?.trim()) {
          await sql`
            UPDATE project_members
            SET name=${name}, role=${role}, area=${area||'Other'}, resp=${resp||''}, system_role=${systemRole}, password=${password}
            WHERE project_code=${code} AND member_id=${id}
          `;
        } else {
          await sql`
            UPDATE project_members
            SET name=${name}, role=${role}, area=${area||'Other'}, resp=${resp||''}, system_role=${systemRole}
            WHERE project_code=${code} AND member_id=${id}
          `;
        }
      } else {
        await sql`
          INSERT INTO project_members (project_code, member_id, name, role, area, resp, system_role, password)
          VALUES (${code}, ${id}, ${name}, ${role}, ${area||'Other'}, ${resp||''}, ${systemRole}, ${password})
          ON CONFLICT (project_code, member_id) DO NOTHING
        `;
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save member', detail: err.message });
    }
  }

  // ── DELETE: remove a member ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const code     = req.query?.project_code?.trim().toUpperCase();
    const memberId = req.query?.member_id;
    if (!code || !memberId) return res.status(400).json({ error: 'project_code and member_id required' });
    try {
      await sql`DELETE FROM project_members WHERE project_code=${code} AND member_id=${memberId}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to remove member', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
