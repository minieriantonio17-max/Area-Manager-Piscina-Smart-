import Papa from "papaparse";

export type Client = {
  client_id: string;
  client_name: string;
  province?: string;
  city?: string;
  email?: string;
  phone?: string;
};

export type SaleFact = {
  client_id: string;
  client_name: string;
  year: number;
  month?: number | null;
  amount: number;
  source_column?: string;
};

export type SemestreRow = Record<string, any>;

export function parseCSV<T=any>(csvText: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err) => reject(err)
    });
  });
}

export function sum(arr: number[]) { return arr.reduce((a,b)=>a+b,0); }

export function groupBy<T, K extends string|number>(arr: T[], keyFn: (x:T)=>K): Record<K, T[]> {
  return arr.reduce((acc: any, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function fmtEUR(n: number) {
  return (Number(n)||0).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function growthPerc(curr?: number, prev?: number) {
  if (!prev || prev === 0) return curr ? 100 : 0;
  return ((Number(curr||0) - Number(prev||0)) / Number(prev||0)) * 100;
}

export function normalizeName(s?: string) {
  if (!s) return "";
  const t = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return t.replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
}

export async function loadDefaultData(): Promise<{
  clients: Client[]; sales: SaleFact[]; semestre: SemestreRow[]; derived: SaleFact[];
}> {
  const [cm, sf, sem] = await Promise.all([
    fetch("/data/clients_master.csv").then(r => r.text()).then(parseCSV<Client>),
    fetch("/data/sales_facts.csv").then(r => r.text()).then(parseCSV<SaleFact>),
    fetch("/data/semestre2025_gen.csv").then(r => r.text()).then(parseCSV<SemestreRow>),
  ]);
  // Normalize types
  const sales = sf.map(s => ({...s, year: Number(s.year), month: s.month===""?null:Number(s.month)}));
  // Create derived facts from semestre file if present
  const derived = deriveFromSemestre(cm, sem);
  return { clients: cm, sales, semestre: sem, derived };
}

// Try to link semestre rows to clients by name, and build 2024/2025 facts using "al 30/06" values.
export function deriveFromSemestre(clients: Client[], semestre: SemestreRow[]): SaleFact[] {
  if (!semestre?.length) return [];
  const nameIndex = new Map<string, Client>();
  clients.forEach(c => nameIndex.set(normalizeName(c.client_name), c));
  // Heuristic: find columns by includes
  const KEY_NAME = Object.keys(semestre[0]).find(k => normalizeName(k).includes("descrizione") || normalizeName(k).includes("cliente") || normalizeName(k).includes("ragione") ) || Object.keys(semestre[0])[0];
  const COL_2025 = Object.keys(semestre[0]).find(k => normalizeName(k).includes("al-30-06-2025") || normalizeName(k).includes("al-30-6-2025") ) ||
                   Object.keys(semestre[0]).find(k => normalizeName(k).includes("periodo_06_2025")) || "";
  const COL_2024 = Object.keys(semestre[0]).find(k => normalizeName(k).includes("al-30-06-2024") || normalizeName(k).includes("al-30-6-2024") ) ||
                   Object.keys(semestre[0]).find(k => normalizeName(k).includes("periodo_06_2024")) || "";

  const facts: SaleFact[] = [];
  for (const row of semestre) {
    const rawName = String(row[KEY_NAME] ?? "").trim();
    if (!rawName) continue;
    const key = normalizeName(rawName);
    const c = nameIndex.get(key);
    const v2025 = Number(row[COL_2025] ?? 0);
    const v2024 = Number(row[COL_2024] ?? 0);
    if (c && (v2025 || v2024)) {
      if (v2025) facts.push({ client_id: c.client_id, client_name: c.client_name, year: 2025, month: null, amount: v2025, source_column: COL_2025 });
      if (v2024) facts.push({ client_id: c.client_id, client_name: c.client_name, year: 2024, month: null, amount: v2024, source_column: COL_2024 });
    }
  }
  return facts;
}

// Upload merge: replace datasets by file name match (or auto-detect)
export async function mergeUploads(files: File[], current: {clients: Client[]; sales: SaleFact[]; semestre: SemestreRow[]}) {
  const loaded = await Promise.all(files.map(async f => ({ name: f.name.toLowerCase(), data: await f.text() })));
  let clients = current.clients.slice();
  let sales = current.sales.slice();
  let semestre = current.semestre.slice();
  for (const f of loaded) {
    if (f.name.includes("clients_master")) {
      clients = await parseCSV<Client>(f.data);
    } else if (f.name.includes("sales_facts")) {
      sales = (await parseCSV<SaleFact>(f.data)).map(s => ({...s, year: Number(s.year), month: s.month?Number(s.month):null}));
    } else if (f.name.includes("semestre2025_gen")) {
      semestre = await parseCSV<SemestreRow>(f.data);
    } else {
      // auto-detect by headers
      if (f.data.includes("client_id,client_name")) clients = await parseCSV<Client>(f.data);
      else if (f.data.toLowerCase().includes("fatturato al 30/06") || f.data.toLowerCase().includes("periodo_06_2025")) semestre = await parseCSV<SemestreRow>(f.data);
      else if (f.data.toLowerCase().includes("year") && f.data.toLowerCase().includes("amount")) sales = (await parseCSV<SaleFact>(f.data)).map(s=>({...s, year:Number(s.year), month:s.month?Number(s.month):null}));
    }
  }
  return { clients, sales, semestre, derived: deriveFromSemestre(clients, semestre) };
}

// Province centers (approx) for Italy
export type Pos = { lat:number; lng:number };
export const provinceCenter: Record<string, Pos> = {
  "MI": { lat:45.4642, lng:9.19 },
  "CR": { lat:45.1349, lng:9.2876 },
  "PV": { lat:45.1847, lng:9.1582 },
  "LO": { lat:45.314, lng:9.5 },
  "MN": { lat:45.1564, lng:10.7914 },
  "BO": { lat:44.4949, lng:11.3426 },
  "RE": { lat:44.6976, lng:10.6313 },
  "FE": { lat:44.8381, lng:11.6198 },
  "NO": { lat:45.4469, lng:8.6152 },
  "VB": { lat:45.921, lng:8.5518 },
  "SP": { lat:44.107, lng:9.8289 },
  "CZ": { lat:38.9029, lng:16.5944 },
  "CS": { lat:39.2983, lng:16.2534 },
  "RC": { lat:38.1113, lng:15.6473 },
  "KR": { lat:39.0808, lng:17.127 },
  "VV": { lat:38.6762, lng:16.1016 }
};

// Visits storage (localStorage)
export type Visit = { client_id: string; date: string; province?: string };
export function getVisits(): Visit[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("visits")||"[]"); } catch { return []; }
}
export function addVisit(v: Visit) {
  if (typeof window === "undefined") return;
  const arr = getVisits();
  arr.unshift(v);
  localStorage.setItem("visits", JSON.stringify(arr));
}
export function lastVisitByProvince(): Record<string, string> {
  const out: Record<string, string> = {};
  getVisits().forEach(v => {
    if (!v.province) return;
    if (!out[v.province] || new Date(v.date) > new Date(out[v.province])) out[v.province] = v.date;
  });
  return out;
}