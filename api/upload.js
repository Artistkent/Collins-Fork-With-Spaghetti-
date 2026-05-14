import { sql } from '@vercel/postgres';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  const { rows } = req.body; // parsed Excel rows from the frontend

  // 1. Ask Claude to clean/structure the data
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract and structure this data as JSON: ${JSON.stringify(rows)}`
    }]
  });

  const structured = JSON.parse(response.content[0].text);

  // 2. Insert into Postgres
  for (const item of structured) {
    await sql`INSERT INTO your_table (col1, col2) VALUES (${item.col1}, ${item.col2})`;
  }

  res.status(200).json({ ok: true });
}