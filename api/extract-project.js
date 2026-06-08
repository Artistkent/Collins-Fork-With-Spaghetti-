// api/extract-project.js
// Reads a project brief (plain text) and uses Claude to extract structured
// tasks, owners, dates and priorities. Returns JSON that the Create Project
// wizard in the frontend can consume directly.
//
// Required env var: ANTHROPIC_API_KEY
// Deploy to: /api/extract-project  (Vercel serverless function)

import Anthropic from '@anthropic-ai/sdk';

// Team members the AI can assign ownership to.
// Keep this in sync with the TEAM array in your frontend.
const TEAM_MEMBERS = [
  { id: 'callum',      name: 'Callum',      role: 'President / CEO' },
  { id: 'sandhya',     name: 'Sandhya',     role: 'Vice President / COO' },
  { id: 'kufre',       name: 'Kufre',       role: 'Training & Dev Manager / CTO' },
  { id: 'tolulope',    name: 'Tolulope',     role: 'Project Manager' },
  { id: 'uchechukwu',  name: 'Uchechukwu',  role: 'Event / Media Manager' },
];

const SYSTEM_PROMPT = `You are a project management assistant. Your job is to read a project brief and extract a structured list of tasks from it.

You must respond with ONLY valid JSON — no markdown, no backticks, no commentary before or after.

The JSON must follow this exact schema:
{
  "projectName": "string — infer from the brief, or use the provided name if given",
  "description": "string — one sentence summarising the project",
  "tasks": [
    {
      "id": number (1-based index),
      "desc": "string — clear, action-oriented task description",
      "owner": "string — must be one of: callum, sandhya, kufre, tolulope, uchechukwu",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "status": "Not Started",
      "pri": "Low | Medium | High | Critical",
      "pct": 0,
      "deps": "string — comma-separated task IDs this task depends on, or empty string",
      "notes": "string — any useful context from the brief, or empty string"
    }
  ]
}

Rules:
- Extract between 5 and 30 tasks. If the brief is vague, infer sensible tasks from the project type.
- Assign owners based on their roles: Callum (strategy/approvals), Sandhya (operations), Kufre (training/tech/content), Tolulope (promotion/budget/partnerships), Uchechukwu (media/events/logistics).
- If a brief mentions a person by name or role, map them to the closest team member id.
- Infer realistic start/end dates. If no dates are mentioned, spread tasks across a reasonable project timeline starting from today.
- Set priority based on language: words like "critical", "urgent", "must" → Critical or High. Routine tasks → Medium or Low.
- Write task descriptions in imperative form: "Prepare speaker briefing pack", not "Speaker briefing".
- Always return valid JSON. Never include trailing commas or comments inside the JSON.`;

export default async function handler(req, res) {
  // CORS — allows the Vite dev proxy and Vercel frontend to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, projectName } = req.body ?? {};

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Request body must include a non-empty "text" field.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables.' });
  }

  const client = new Anthropic();

  const userMessage = [
    projectName ? `Project name (if not found in brief): ${projectName}` : '',
    `Team members available for assignment:\n${TEAM_MEMBERS.map(m => `  - ${m.id}: ${m.name} (${m.role})`).join('\n')}`,
    `\nProject brief:\n${text.slice(0, 12000)}`, // guard against huge inputs
  ].filter(Boolean).join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Strip accidental markdown fences if Claude adds them despite the prompt
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error. Raw response:\n', rawText);
      return res.status(502).json({
        error: 'Claude returned malformed JSON. Try again or simplify your brief.',
        raw: rawText.slice(0, 500),
      });
    }

    // Validate and sanitise each task before returning
    const today = new Date().toISOString().slice(0, 10);
    const validIds = new Set(TEAM_MEMBERS.map(m => m.id));

    const tasks = (parsed.tasks ?? []).map((t, i) => ({
      id:     Number(t.id)   || i + 1,
      desc:   String(t.desc  || `Task ${i + 1}`).trim(),
      owner:  validIds.has(t.owner) ? t.owner : TEAM_MEMBERS[0].id,
      start:  isValidDate(t.start)  ? t.start  : today,
      end:    isValidDate(t.end)    ? t.end    : today,
      status: 'Not Started',
      pri:    ['Low','Medium','High','Critical'].includes(t.pri) ? t.pri : 'Medium',
      pct:    0,
      deps:   String(t.deps  || '').trim(),
      notes:  String(t.notes || '').trim(),
    }));

    return res.status(200).json({
      projectName: parsed.projectName || projectName || 'New Project',
      description: parsed.description || '',
      tasks,
    });

  } catch (err) {
    console.error('extract-project error:', err.message);
    return res.status(500).json({ error: 'Extraction failed.', detail: err.message });
  }
}

function isValidDate(str) {
  if (!str || typeof str !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}
