import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET — load all tasks and RACI from Neon ──
  if (req.method === "GET") {
    try {
      const tasks = await sql`SELECT * FROM tasks ORDER BY id`;
      const raciRows = await sql`SELECT data, saved_by, saved_at FROM raci_state WHERE id = 1`;

      if (tasks.length === 0) return res.status(200).json({ exists: false });

      const raci = raciRows.length > 0 ? JSON.parse(raciRows[0].data) : {};
      const savedBy = raciRows[0]?.saved_by ?? "";
      const savedAt = raciRows[0]?.saved_at ?? "";

      // Map DB column names back to what the app expects
      const mapped = tasks.map(t => ({
        id:        t.id,
        desc:      t.description,
        owner:     t.owner,
        start:     t.start_date,
        end:       t.end_date,
        status:    t.status,
        pri:       t.priority,
        deps:      t.deps,
        notes:     t.notes,
        pct:       t.pct,
        updatedAt: t.updated_at,
      }));

      return res.status(200).json({ exists: true, tasks: mapped, raci, savedBy, savedAt });
    } catch (err) {
      console.error("GET error:", err.message);
      return res.status(500).json({ error: "Failed to load", detail: err.message });
    }
  }

  // ── POST — save all tasks and RACI to Neon ──
  if (req.method === "POST") {
    try {
      const { tasks, raci, savedBy, savedAt } = req.body;

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "Valid tasks array required" });
      }

      // Upsert each task (insert or update if already exists)
      for (const t of tasks) {
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
      }

      // Save RACI as JSON
      await sql`
        INSERT INTO raci_state (id, data, saved_by, saved_at)
        VALUES (1, ${JSON.stringify(raci)}, ${savedBy}, ${savedAt})
        ON CONFLICT (id) DO UPDATE SET
          data     = EXCLUDED.data,
          saved_by = EXCLUDED.saved_by,
          saved_at = EXCLUDED.saved_at
      `;

      return res.status(200).json({ ok: true, taskCount: tasks.length, savedAt });
    } catch (err) {
      console.error("POST error:", err.message);
      return res.status(500).json({ error: "Failed to save", detail: err.message });
    }
  }

  // ── DELETE — reset everything ──
  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM tasks`;
      await sql`DELETE FROM raci_state`;
      return res.status(200).json({ ok: true, message: "Cleared" });
    } catch (err) {
      return res.status(500).json({ error: "Clear failed", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}