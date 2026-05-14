import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const t = req.body;

    await sql`
      INSERT INTO tasks (id, description, owner, start_date, end_date, status, priority, deps, notes, pct, updated_at)
      VALUES (${t.id}, ${t.desc}, ${t.owner}, ${t.start}, ${t.end}, ${t.status}, ${t.pri}, ${t.deps}, ${t.notes}, ${t.pct}, ${t.updatedAt ?? null})
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description,
        owner       = EXCLUDED.owner,
        start_date  = EXCLUDED.start_date,
        end_date    = EXCLUDED.end_date,
        status      = EXCLUDED.status,
        priority    = EXCLUDED.priority,
        deps        = EXCLUDED.deps,
        notes       = EXCLUDED.notes,
        pct         = EXCLUDED.pct,
        updated_at  = EXCLUDED.updated_at
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('update-task error:', err.message);
    return res.status(500).json({ error: 'Failed to update', detail: err.message });
  }
}