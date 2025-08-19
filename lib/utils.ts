import Papa from "papaparse";
export type Client = { client_id:string; client_name:string; province?:string; city?:string; email?:string; phone?:string; };
export type SaleFact = { client_id:string; client_name:string; year:number; month?:number|null; amount:number; };
export type SemestreRow = Record<string, any>;
export function parseCSV<T=any>(csvText: string): Promise<T[]> { return new Promise((res, rej)=>{
  Papa.parse<T>(csvText,{header:true,dynamicTyping:true,skipEmptyLines:true,complete: r=>res(r.data as T[]), error: e=>rej(e)});
});}
export async function loadDefaultData(){ const [cm,sf,sem] = await Promise.all([
  fetch("/data/clients_master.csv").then(r=>r.text()).then(parseCSV<Client>),
  fetch("/data/sales_facts.csv").then(r=>r.text()).then(parseCSV<SaleFact>),
  fetch("/data/semestre2025_gen.csv").then(r=>r.text()).then(parseCSV<SemestreRow>),
]); return { clients:cm, sales: sf.map(s=>({...s, year:Number(s.year), month:(s.month===""?null:Number(s.month)) })), semestre:sem };}
export function groupBy<T,K extends string|number>(a:T[],f:(x:T)=>K){return a.reduce((acc:any,it:any)=>{const k=f(it);(acc[k] ||= []).push(it);return acc;},{});}
export function fmtEUR(n:number){ return (Number(n)||0).toLocaleString("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}); }
export function growthPerc(curr?:number, prev?:number){ if(!prev||prev===0) return curr?100:0; return ((Number(curr||0)-Number(prev||0))/Number(prev||0))*100; }
export const provinceCenter: Record<string, {lat:number;lng:number}> = {
  "MI": { lat:45.4642, lng:9.19 }, "CR": { lat:45.1349, lng:9.2876 }, "PV": { lat:45.1847, lng:9.1582 }, "LO": { lat:45.314, lng:9.5 },
  "MN": { lat:45.1564, lng:10.7914 }, "BO": { lat:44.4949, lng:11.3426 }, "RE": { lat:44.6976, lng:10.6313 }, "FE": { lat:44.8381, lng:11.6198 },
  "NO": { lat:45.4469, lng:8.6152 }, "VB": { lat:45.921, lng:8.5518 }, "SP": { lat:44.107, lng:9.8289 }, "CZ": { lat:38.9029, lng:16.5944 },
  "CS": { lat:39.2983, lng:16.2534 }, "RC": { lat:38.1113, lng:15.6473 }, "KR": { lat:39.0808, lng:17.127 }, "VV": { lat:38.6762, lng:16.1016 }
};
export type Visit = { client_id: string; date: string; province?: string };
export function getVisits(): Visit[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem("visits")||"[]"); } catch { return []; } }
export function addVisit(v: Visit) { if (typeof window === "undefined") return; const arr = getVisits(); arr.unshift(v); localStorage.setItem("visits", JSON.stringify(arr)); }
export function lastVisitByProvince(): Record<string, string> { const out: Record<string, string> = {}; getVisits().forEach(v => { if (!v.province) return; if (!out[v.province] || new Date(v.date) > new Date(out[v.province])) out[v.province] = v.date; }); return out; }