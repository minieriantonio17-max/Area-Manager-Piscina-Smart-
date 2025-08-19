"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadDefaultData, fmtEUR, groupBy, growthPerc, mergeUploads, Client, SaleFact, lastVisitByProvince, provinceCenter } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "@/components/charts";
import { Upload, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const OBIETTIVO_PIENO = 1300000;
const OBIETTIVO_MINIMO = 950000;

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleFact[]>([]);
  const [derived, setDerived] = useState<SaleFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [provinceAlerts, setProvinceAlerts] = useState<any[]>([]);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDefaultData().then(({clients, sales, derived}) => {
      setClients(clients);
      setSales([...sales]);
      setDerived(derived);
      setLoading(false);
    });
  }, []);

  const salesAll = useMemo(()=> [...sales, ...derived], [sales, derived]);

  const byYear = useMemo(()=>{
    const monthly = salesAll.filter(s=> s.month != null).reduce((acc:any, s)=>{
      const k = `${s.year}`;
      acc[k] = (acc[k] ?? 0) + Number(s.amount||0);
      return acc;
    }, {});
    const yearly = salesAll.filter(s=> s.month == null).reduce((acc:any, s)=>{
      const k = `${s.year}`;
      // Prefer monthly when present
      if (monthly[k] != null) return acc;
      acc[k] = (acc[k] ?? 0) + Number(s.amount||0);
      return acc;
    }, {});
    return {...yearly, ...monthly};
  }, [salesAll]);

  const byClientYear = useMemo(()=> groupBy(salesAll, (s)=> `${s.client_id}-${s.year}`), [salesAll]);

  const progress = useMemo(()=>{
    const y2025 = byYear["2025"] ?? 0;
    const percPieno = (y2025 / OBIETTIVO_PIENO) * 100;
    const percMinimo = (y2025 / OBIETTIVO_MINIMO) * 100;
    return { y2025, percPieno, percMinimo };
  }, [byYear]);

  const comp2025vs2024 = useMemo(()=>{
    const rows: any[] = [];
    for (const c of clients) {
      const s2025 = (byClientYear[`${c.client_id}-2025`] ?? []).reduce((a,b)=>a+Number(b.amount||0),0);
      const s2024 = (byClientYear[`${c.client_id}-2024`] ?? []).reduce((a,b)=>a+Number(b.amount||0),0);
      if (s2025 || s2024) {
        rows.push({ client_id: c.client_id, client_name: c.client_name, province: c.province, v2025: s2025, v2024: s2024, deltaPerc: growthPerc(s2025, s2024) });
      }
    }
    rows.sort((a,b)=> (a.deltaPerc ?? 0) - (b.deltaPerc ?? 0));
    return rows;
  }, [clients, byClientYear]);

  useEffect(()=>{
    // Client alerts
    const alertsNew: any[] = [];
    const risky = comp2025vs2024.filter(r => (r.deltaPerc ?? 0) < -20).slice(0, 10);
    const warn = comp2025vs2024.filter(r => (r.deltaPerc ?? 0) >= -20 && (r.deltaPerc ?? 0) < -5).slice(0, 10);
    const grow = comp2025vs2024.filter(r => (r.deltaPerc ?? 0) > 0).slice(-10).reverse();
    if (risky.length) alertsNew.push({ type: "danger", title: `Clienti con calo >20%`, items: risky.map(x => `${x.client_name} ${x.deltaPerc.toFixed(0)}%`) });
    if (warn.length) alertsNew.push({ type: "warn", title: `Clienti in calo 5–20%`, items: warn.map(x => `${x.client_name} ${x.deltaPerc.toFixed(0)}%`) });
    if (grow.length) alertsNew.push({ type: "ok", title: `Clienti in crescita (Top)`, items: grow.map(x => `${x.client_name} +${x.deltaPerc.toFixed(0)}%`) });
    setAlerts(alertsNew);

    // Province alerts (presidio): rank by revenue share and last visit
    const byProvince = new Map<string, { amount:number }>();
    for (const r of comp2025vs2024) {
      const pr = (r.province||"").toUpperCase();
      if (!pr) continue;
      const curr = byProvince.get(pr) || { amount:0 };
      curr.amount += r.v2025 || r.v2024 || 0;
      byProvince.set(pr, curr);
    }
    const last = lastVisitByProvince();
    const now = new Date();
    const provRows = Array.from(byProvince.entries()).map(([pr, v]) => {
      const lastStr = last[pr];
      const weeks = lastStr ? Math.floor((now.getTime() - new Date(lastStr).getTime()) / (7*24*3600*1000)) : null;
      return { province: pr, amount: v.amount, weeksSince: weeks };
    }).sort((a,b)=> (b.amount - a.amount));
    const toVisit = provRows.filter(r => (r.weeksSince==null || r.weeksSince>=8)).slice(0,5);
    setProvinceAlerts(toVisit);
  }, [comp2025vs2024]);

  const barData = useMemo(()=>[{ year: "2024", value: byYear["2024"] ?? 0 },{ year: "2025", value: byYear["2025"] ?? 0 }],[byYear]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const merged = await mergeUploads(files, { clients, sales, semestre: [] });
    setClients(merged.clients);
    setSales(merged.sales);
    setDerived(merged.derived);
  }

  async function exportPDF() {
    if (!dashRef.current) return;
    const el = dashRef.current;
    const canvas = await html2canvas(el);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(imgData, "PNG", (pageW - w)/2, (pageH - h)/2, w, h);
    pdf.save("report-settimanale.pdf");
  }

  if (loading) return <div>Caricamento dati…</div>;

  return (
    <div className="space-y-6" ref={dashRef}>
      <div className="flex items-center justify-between">
        <h2 className="h1">Dashboard Fatturato</h2>
        <div className="flex gap-3">
          <Button onClick={exportPDF}><Download className="inline-block mr-2" /> Esporta PDF</Button>
          <label className="block">
            <input type="file" multiple onChange={onUpload} className="hidden" />
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-2 cursor-pointer hover:bg-gray-50">Upload dati</div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Obiettivo pieno (1,3M)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmtEUR(progress.y2025)}</div>
            <div className="subtle">Raggiunto: {progress.percPieno.toFixed(1)}%</div>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-brand-600" style={{ width: `${Math.min(100, progress.percPieno)}%`}} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Obiettivo minimo (950k)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmtEUR(progress.y2025)}</div>
            <div className="subtle">Raggiunto: {progress.percMinimo.toFixed(1)}%</div>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-green-600" style={{ width: `${Math.min(100, progress.percMinimo)}%`}} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Box alert</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i)=> (
              <div key={i} className="rounded-xl border p-3">
                <div className="font-medium">{a.title}</div>
                <ul className="mt-1 text-sm text-gray-700 list-disc pl-5 space-y-1">
                  {a.items.map((x:string, idx:number)=>(<li key={idx}>{x}</li>))}
                </ul>
              </div>
            ))}
            {!alerts.length && <div className="text-sm text-gray-500">Nessun alert.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Fatturato 2025 vs 2024</CardTitle></CardHeader>
          <CardContent style={{height: 320}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{year:"2024", value: byYear["2024"]||0}, {year:"2025", value: byYear["2025"]||0}]}>
                <XAxis dataKey="year" /><YAxis /><Tooltip formatter={(v)=>fmtEUR(Number(v))} /><Legend />
                <Bar dataKey="value" name="Fatturato" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Province da presidiare (8+ settimane)</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {provinceAlerts.map((p,i)=>(
                <li key={i} className="border rounded-xl p-2 flex items-center justify-between">
                  <div><div className="font-medium">{p.province}</div><div className="text-gray-500">{p.weeksSince==null? "mai visitata": `${p.weeksSince} sett.`}</div></div>
                  <div className="badge badge-amber">peso: {fmtEUR(p.amount)}</div>
                </li>
              ))}
              {!provinceAlerts.length && <div className="text-gray-500">Tutte presidiate di recente.</div>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Clienti in crescita/calo</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Prov.</th><th className="py-2 pr-4">2024</th><th className="py-2 pr-4">2025</th><th className="py-2 pr-4">Δ %</th></tr>
              </thead>
              <tbody>
                {comp2025vs2024.map((r,i)=> (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4">{r.client_name}</td>
                    <td className="py-2 pr-4">{r.province||"-"}</td>
                    <td className="py-2 pr-4">{fmtEUR(r.v2024)}</td>
                    <td className="py-2 pr-4">{fmtEUR(r.v2025)}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${r.deltaPerc < -20 ? "badge-red" : r.deltaPerc < -5 ? "badge-amber" : "badge-green"}`}>
                        {r.deltaPerc.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}