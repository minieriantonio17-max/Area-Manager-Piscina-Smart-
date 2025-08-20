
export function parseCSV(text){
  try{
    const lines = (text||"").split(/\r?\n/).filter(l=>l.trim().length>0);
    if(lines.length===0) return [];
    const headers = lines[0].split(",").map(h=>h.trim());
    const rows = [];
    for(let i=1;i<lines.length;i++){
      const parts = lines[i].split(",");
      const o = {};
      headers.forEach((h,idx)=>{ o[h] = (parts[idx]??"").trim(); });
      rows.push(o);
    }
    return rows;
  }catch(e){ console.error("parseCSV error",e); return []; }
}
export function fmtEUR(n){
  const v = Number(n||0);
  try{ return v.toLocaleString("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}); }
  catch{ return `${v} €`; }
}
export function groupBy(arr, keyFn){
  const out = {};
  (arr||[]).forEach(it=>{
    const k = keyFn(it) || "";
    out[k] = out[k]||[];
    out[k].push(it);
  });
  return out;
}
export function growthPerc(cur, prev){
  const a = Number(cur||0), b = Number(prev||0);
  if(b===0) return a>0?100:0;
  return (a/b-1)*100;
}
