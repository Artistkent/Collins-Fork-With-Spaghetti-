import { B, STATUS_STYLE, PRI_STYLE, initials } from "../constants.js";

export function Avatar({ name, color, size = 32 }){
  const bg = color || B.ac;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:size * 0.38, fontWeight:700, color:"#fff" }}>{initials(name)}</span>
    </div>
  );
}

export function Badge({ label, small = false }){
  const s = STATUS_STYLE[label] || { bg:B.pl, fg:B.md, bd:"transparent" };
  return (
    <span style={{ display:"inline-block", padding:small?"2px 7px":"3px 10px", borderRadius:20,
      fontSize:small?10:11, fontWeight:600, background:s.bg, color:s.fg,
      border:`1px solid ${s.bd}`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

export function PriBadge({ label }){
  const s = PRI_STYLE[label] || PRI_STYLE.Low;
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:700, background:s.bg, color:s.fg, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

export function Pbar({ pct, h = 6, done = false }){
  return (
    <div style={{ height:h, borderRadius:99, background:B.pl, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${Math.min(100, pct||0)}%`, borderRadius:99,
        transition:"width .4s", background:done ? "#1A5C2A" : B.ac }} />
    </div>
  );
}

export function Card({ children, style: s }){
  return (
    <div style={{ background:B.wh, borderRadius:14, border:`1px solid ${B.pl}`,
      padding:"16px 18px", ...s }}>
      {children}
    </div>
  );
}

export function SecHead({ title, sub }){
  return (
    <div style={{ marginBottom:16 }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:B.dk, margin:0 }}>{title}</h2>
      {sub && <p style={{ color:B.tg, fontSize:12, margin:"3px 0 0", lineHeight:1.4 }}>{sub}</p>}
    </div>
  );
}

export function Toast({ msg }){
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      background:B.dk, color:"#fff", padding:"10px 20px", borderRadius:99,
      fontSize:13, fontWeight:600, zIndex:999, whiteSpace:"nowrap",
      boxShadow:"0 4px 20px rgba(0,0,0,.25)" }}>
      {msg}
    </div>
  );
}

export function Inp({ value, onChange, placeholder, type="text", disabled=false, style:s }){
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${B.pl}`,
        borderRadius:9, fontSize:13, color:B.tx, background:disabled?"#f5f5f5":B.wh,
        boxSizing:"border-box", ...s }} />
  );
}

export function Sel({ value, onChange, children, disabled=false, style:s }){
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${B.pl}`,
        borderRadius:9, fontSize:13, color:B.tx, background:disabled?"#f5f5f5":B.wh,
        boxSizing:"border-box", WebkitAppearance:"none", ...s }}>
      {children}
    </select>
  );
}

export function Btn({ onClick, children, variant="primary", disabled=false, style:s }){
  const vars = {
    primary:   { bg:B.dk,    fg:"#fff",  border:"none" },
    secondary: { bg:B.pl,    fg:B.md,    border:"none" },
    ghost:     { bg:"transparent", fg:B.tg, border:`1.5px solid ${B.pl}` },
    danger:    { bg:"#FFE0E0", fg:"#8B1A1A", border:"none" },
  };
  const v = vars[variant] || vars.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:"11px 20px", borderRadius:10, border:v.border,
        background:disabled?"#ccc":v.bg, color:disabled?"#888":v.fg,
        fontSize:14, fontWeight:700, cursor:disabled?"not-allowed":"pointer",
        transition:"opacity .15s", ...s }}>
      {children}
    </button>
  );
}
