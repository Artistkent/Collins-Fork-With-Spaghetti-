// api/state.js — NC Platform shared state via Upstash Redis

const STATE_KEY = "nc_shared_state_v1";
const KV_URL   = process.env.SaveState_KV_REST_API_URL   || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.SaveState_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;

// ── Upstash REST API helpers ──────────────────────────────────────────────────
// Uses the /pipeline endpoint — most reliable for large JSON values
async function kvGet(key) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["GET", key]]),
  });
  if (!res.ok) throw new Error(`kvGet HTTP ${res.status}`);
  const json = await res.json();
  // Pipeline returns array of results: [{ result: "value" }]
  return json[0]?.result ?? null;
}

async function kvSet(key, value) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["SET", key, value]]),
  });
  if (!res.ok) throw new Error(`kvSet HTTP ${res.status}`);
  const json = await res.json();
  if (json[0]?.error) throw new Error(`kvSet error: ${json[0].error}`);
  return true;
}

async function kvDel(key) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["DEL", key]]),
  });
  if (!res.ok) throw new Error(`kvDel HTTP ${res.status}`);
  return true;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Env var guard
  if (!KV_URL || !KV_TOKEN) {
    const found = Object.keys(process.env).filter(k =>
      k.includes("SaveState") || k.includes("KV") || k.includes("UPSTASH")
    );
    console.error("Missing env vars. Found:", found);
    return res.status(200).json({ exists: false, debug: "env vars missing", found });
  }

  // ── CLEAR — visit /api/state?clear=1 to reset ──────────────────────────────
  if (req.method === "DELETE" || req.query?.clear === "1") {
    try {
      await kvDel(STATE_KEY);
      return res.status(200).json({ ok: true, message: "Cleared — app uses default data" });
    } catch (err) {
      return res.status(500).json({ error: "Clear failed", detail: err.message });
    }
  }

  // ── GET — load shared state ────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const stored = await kvGet(STATE_KEY);

      // Nothing saved yet
      if (!stored) return res.status(200).json({ exists: false });

      let state;
      try { state = JSON.parse(stored); }
      catch { await kvDel(STATE_KEY); return res.status(200).json({ exists: false }); }

      // Validate — auto-clear if corrupt
      if (!Array.isArray(state.tasks) || state.tasks.length === 0) {
        await kvDel(STATE_KEY);
        return res.status(200).json({ exists: false });
      }

      return res.status(200).json({ exists: true, ...state });
    } catch (err) {
      console.error("GET error:", err.message);
      return res.status(500).json({ error: "Failed to load", detail: err.message });
    }
  }

  // ── POST — save shared state ───────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = req.body;

      if (!body?.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
        return res.status(400).json({ error: "Valid tasks array required" });
      }

      const payload = JSON.stringify({
        tasks:   body.tasks,
        raci:    body.raci    ?? {},
        savedBy: body.savedBy ?? "Committee Member",
        savedAt: body.savedAt ?? new Date().toISOString(),
      });

      await kvSet(STATE_KEY, payload);

      return res.status(200).json({
        ok: true,
        taskCount: body.tasks.length,
        savedAt: body.savedAt,
      });
    } catch (err) {
      console.error("POST error:", err.message);
      return res.status(500).json({ error: "Failed to save", detail: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
