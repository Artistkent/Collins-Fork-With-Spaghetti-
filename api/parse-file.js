// api/parse-file.js
// Accepts a multipart file upload, extracts text, sends to Groq,
// returns structured project data.
//
// POST /api/parse-file
// Body: multipart/form-data with field "file"

import formidable from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import XLSX from "xlsx";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const config = { api: { bodyParser: false } }; // needed for file uploads

// ── Extract text from file based on type ──────────────────────────────────────
async function extractText(filePath, mimeType, originalName){
  const ext = path.extname(originalName).toLowerCase();

  // DOCX
  if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // PDF
  if (ext === ".pdf" || mimeType === "application/pdf"){
    const data    = new Uint8Array(fs.readFileSync(filePath));
    const doc     = await getDocument({ data }).promise;
    let text      = "";
    for (let i = 1; i <= doc.numPages; i++){
      const page    = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text;
  }

  // XLSX / XLS / CSV
  if ([".xlsx",".xls",".csv"].includes(ext)){
    const workbook = XLSX.readFile(filePath);
    let text = "";
    for (const sheetName of workbook.SheetNames){
      text += `Sheet: ${sheetName}\n`;
      text += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      text += "\n";
    }
    return text;
  }

  // Plain text / markdown
  if ([".txt",".md"].includes(ext) || mimeType?.startsWith("text/")){
    return fs.readFileSync(filePath, "utf-8");
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ── Send text to Groq and get structured project data ───────────────────────
async function parseWithAI(text){
  const prompt = `You are a project management assistant. Extract structured project information from the following document.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just the JSON):
{
  "projectName": "string — name of the project",
  "description": "string — one sentence description",
  "brief": "string — full project background, objectives and scope (preserve as much detail as possible)",
  "tasks": [
    {
      "desc": "string — task description",
      "pri": "Low|Medium|High|Critical",
      "notes": "string — any relevant notes (optional, can be empty string)"
    }
  ]
}

Rules:
- Extract as many tasks as you can identify from the document
- If you cannot find a clear project name, infer one from context
- Keep the brief faithful to the source document
- Priority should be inferred from language like "urgent", "critical", "nice to have" etc. Default to "Medium"
- Do not invent information not present in the document

Document:
${text.slice(0, 12000)}`; // cap at ~12k chars to stay within token limits

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 2000,
  }),
});

const data    = await res.json();
if (!res.ok || data.error) throw new Error(data.error?.message || "Groq API error");
const content = data.choices[0].message.content.trim();
const clean   = content.replace(/^```json\s*/,"").replace(/^```\s*/,"").replace(/```$/,"").trim();
return JSON.parse(clean);
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST")    return res.status(405).json({error:"Method not allowed"});


  if (!process.env.GROQ_API_KEY){
    return res.status(500).json({error:"GROQ_API_KEY not configured"});
  }

  // Parse the uploaded file
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB limit
  const [, files] = await form.parse(req);
  const file = Array.isArray(files.file) ? files.file[0] : files.file;

  if (!file){
    return res.status(400).json({error:"No file uploaded. Send a file with field name 'file'."});
  }

  try {
    const text   = await extractText(file.filepath, file.mimetype, file.originalFilename);
    if (!text?.trim()){
      return res.status(400).json({error:"Could not extract any text from this file."});
    }
    const parsed = await parseWithAI(text);
    return res.status(200).json({ ok:true, ...parsed });
  } catch(err){
    console.error("parse-file error:", err.message);
    return res.status(500).json({error: err.message});
  }
}
