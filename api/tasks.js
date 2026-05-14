import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const tasks = await sql`SELECT * FROM gantt_chart ORDER BY id`;
  res.status(200).json(tasks);
}