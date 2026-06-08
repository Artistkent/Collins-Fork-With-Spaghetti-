import { useState, useRef } from "react";
import { B } from "../constants.js";

const ACCEPTED = ".pdf,.docx,.xlsx,.xls,.csv,.txt,.md";

// ── FileParser widget ─────────────────────────────────────────────────────────
// Drop it into the Create Project wizard. On success it calls onParsed(data)
// where data = { projectName, description, brief, tasks[] }
export function FileParser({ onParsed, onSkip }){
  const [dragging,  setDragging]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [status,    setStatus]    = useState("idle"); // idle|parsing|done|error
  const [errMsg,    setErrMsg]    = useState("");
  const inputRef = useRef();

  function handleFile(f){
    if (!f) return;
    setFile(f);
    setStatus("idle");
    setErrMsg("");
  }

  async function parse(){
    if (!file) return;
    setStatus("parsing");
    setErrMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/parse-file", { method:"POST", body:form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Parse failed");
      setStatus("done");
      onParsed(data);
    } catch(e){
      setStatus("error");
      setErrMsg(e.message);
    }
  }

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", maxWidth:460, width:"100%" }}>
      <div style={{ fontSize:28, marginBottom:10, textAlign:"center" }}>📎</div>
      <h3 style={{ margin:"0 0 6px", color:B.dk, fontSize:18, textAlign:"center" }}>
        Import from a file
      </h3>
      <p style={{ color:"#607466", fontSize:13, margin:"0 0 20px", textAlign:"center", lineHeight:1.5 }}>
        Upload a project brief, spreadsheet or document and AI will extract the project name, description and tasks automatically.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?B.ac:file?B.md:B.pl}`,
          borderRadius:12, padding:"28px 20px", textAlign:"center",
          background:dragging?B.st:file?"#f0fdf4":"#fafafa",
          cursor:"pointer", transition:"all .2s", marginBottom:16,
        }}>
        <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display:"none" }}
          onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <div>
            <div style={{ fontSize:24, marginBottom:6 }}>📄</div>
            <div style={{ fontSize:13, fontWeight:700, color:B.dk }}>{file.name}</div>
            <div style={{ fontSize:11, color:B.tg, marginTop:3 }}>
              {(file.size / 1024).toFixed(1)} KB · click to change
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:32, marginBottom:8 }}>⬆️</div>
            <div style={{ fontSize:13, fontWeight:600, color:B.dk, marginBottom:4 }}>
              Drop a file here or click to browse
            </div>
            <div style={{ fontSize:11, color:B.tg }}>
              PDF, DOCX, XLSX, CSV, TXT — max 10MB
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {status==="error" && (
        <div style={{ color:"#8B1A1A", fontSize:12, padding:"8px 12px",
          background:"#FFE0E0", borderRadius:8, marginBottom:12 }}>
          ⚠ {errMsg}
        </div>
      )}

      {/* Success */}
      {status==="done" && (
        <div style={{ color:"#1A5C2A", fontSize:12, padding:"8px 12px",
          background:"#C6EFCE", borderRadius:8, marginBottom:12 }}>
          ✓ File parsed — review and edit the details below
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={parse} disabled={!file || status==="parsing"}
          style={{ width:"100%", padding:"12px 0", borderRadius:10, border:"none",
            background:!file||status==="parsing"?"#ccc":B.dk,
            color:"#fff", fontSize:14, fontWeight:700,
            cursor:!file||status==="parsing"?"not-allowed":"pointer" }}>
          {status==="parsing" ? "⏳ Parsing file…" : "✨ Parse with AI"}
        </button>
        <button onClick={onSkip}
          style={{ width:"100%", padding:"10px 0", borderRadius:10,
            border:`1.5px solid ${B.pl}`, background:"transparent",
            color:B.tg, fontSize:13, cursor:"pointer" }}>
          Skip — fill in manually
        </button>
      </div>
    </div>
  );
}
