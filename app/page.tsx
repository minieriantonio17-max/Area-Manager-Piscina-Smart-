"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadDefaultData, fmtEUR, groupBy, growthPerc, lastVisitByProvince } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "@/components/charts";

const OBIETTIVO_PIENO=1300000, OBIETTIVO_MINIMO=950000;

export default function Dashboard(){
  const [clients,setClients]=useState<any[]>([]); const [sales,setSales]=useState<any[]>([]);
  const dashRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ loadDefaultData().then(d=>{setClients(d.clients); setSales(d.sales);}); },[]);
  const byYear=useMemo(()=>{
    const monthly = sales.filter((s:any)=>s.month!=null).reduce((a:any,s:any)=>{a[s.year]=(a[s.year]||0)+Number(s.amount||0);return a;},{});
    const yearly = sales.filter((s:any)=>s.month==null).reduce((a:any,s:any)=>{ if(monthly[s.year]!=null) return a; a[s.year]=(a[s.year]||0)+Number(s.amount||0); return a;},{});
    return {...yearly,...monthly};
  },[sales]);
  const y2025=byYear[2025]||0, percPieno=y2025/OBIETTIVO_PIENO*100, percMinimo=y2025/OBIETTIVO_MINIMO*100;

  const byCY=useMemo(()=>groupBy(sales,(s:any)=>`${s.client_id}-${s.year}`),[sales]);
  const comp=useMemo(()=>{
    const rows:any[]=[];
    clients.forEach((c:any)=>{ const s25=(byCY[`${c.client_id}-2025`]||[]).reduce((a:any,b:any)=>a+Number(b.amount||0),0);
      const s24=(byCY[`${c.client_id}-2024`]||[]).reduce((a:any,b:any)=>a+Number(b.amount||0),0);
      if(s25||s24) rows.push({client_name:c.client_name, province:c.province, v2025:s25, v2024:s24, delta:growthPerc(s25,s24)});
    }); return rows.sort((a,b)=>a.delta-b.delta);
  },[clients,byCY]);

  const provinceAlerts = useMemo(()=>{
    const byProv: Record<string, number> = {};
    comp.forEach(r=>{ const p=(r.province||"").toUpperCase(); if(!p) return; byProv[p]=(byProv[p]||0)+(r.v2025||r.v2024||0); });
    const last = lastVisitByProvince(); const now=new Date();
    return Object.entries(byProv).map(([pr,amount])=>{
      const weeks = last[pr] ? Math.floor((now.getTime()-new Date(last[pr]).getTime())/(7*24*3600*1000)) : null;
      return { province: pr, amount, weeksSince: weeks };
    }).filter(x=> x.weeksSince==null || x.weeksSince>=8).sort((a,b)=>b.amount-a.amount).slice(0,5);
  },[comp]);

  async function exportPDF() {
    if (!dashRef.current) return;
    const el = dashRef.current;
    const html2canvas = (await import("html2canvas")).default;
    const { default: jsPDF } = await import("jspdf");
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

  return (<div className="space-y-6" ref={dashRef}>
    <div className="flex items-center justify-between"><h2 className="h1">Dashboard Fatturato</h2>
      <button onClick={exportPDF} className="rounded-2xl px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white shadow-soft">Esporta PDF</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card><CardHeader><CardTitle>Obiettivo pieno (1,3M)</CardTitle></CardHeader><CardContent>
        <div className="text-3xl font-bold">{fmtEUR(y2025)}</div><div className="subtle">Raggiunto: {percPieno.toFixed(1)}%</div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-2 bg-brand-600" style={{width:`${Math.min(100,percPieno)}%`}}/></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Obiettivo minimo (950k)</CardTitle></CardHeader><CardContent>
        <div className="text-3xl font-bold">{fmtEUR(y2025)}</div><div className="subtle">Raggiunto: {percMinimo.toFixed(1)}%</div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-2 bg-green-600" style={{width:`${Math.min(100,percMinimo)}%`}}/></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Box alert</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">
          <div className="rounded-xl border p-3"><div className="font-medium">Clienti con calo &gt;20%</div>
            <ul className="list-disc pl-5 text-sm">{comp.filter(r=>r.delta<-20).slice(0,10).map((r,i)=>(<li key={i}>{r.client_name} {r.delta.toFixed(0)}%</li>))}</ul></div>
          <div className="rounded-xl border p-3"><div className="font-medium">Clienti in calo 5–20%</div>
            <ul className="list-disc pl-5 text-sm">{comp.filter(r=>r.delta>=-20&&r.delta<-5).slice(0,10).map((r,i)=>(<li key={i}>{r.client_name} {r.delta.toFixed(0)}%</li>))}</ul></div>
          <div className="rounded-xl border p-3"><div className="font-medium">Province da presidiare (8+ sett.)</div>
            <ul className="list-disc pl-5 text-sm">{provinceAlerts.map((p,i)=>(<li key={i}>{p.province} • peso {fmtEUR(p.amount)} • {p.weeksSince==null?"mai visitata":p.weeksSince+" sett."}</li>))}</ul></div>
        </div>
      </CardContent></Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Fatturato 2025 vs 2024</CardTitle></CardHeader><CardContent style={{height:320}}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={[{year:"2024",value:byYear[2024]||0},{year:"2025",value:byYear[2025]||0}]}>
          <XAxis dataKey="year"/><YAxis/><Tooltip/><Legend/><Bar dataKey="value" name="Fatturato"/></BarChart></ResponsiveContainer>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Clienti (Δ %)</CardTitle></CardHeader><CardContent>
        <div className="overflow-auto"><table className="min-w-full text-sm"><thead className="text-left text-gray-500"><tr><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Prov.</th><th className="py-2 pr-4">2024</th><th className="py-2 pr-4">2025</th><th className="py-2 pr-4">Δ%</th></tr></thead>
        <tbody>{comp.map((r,i)=>(<tr key={i} className="border-t"><td className="py-2 pr-4">{r.client_name}</td><td className="py-2 pr-4">{r.province||"-"}</td>
        <td className="py-2 pr-4">{fmtEUR(r.v2024)}</td><td className="py-2 pr-4">{fmtEUR(r.v2025)}</td>
        <td className="py-2 pr-4"><span className={`badge ${r.delta<-20?"badge-red":r.delta<-5?"badge-amber":"badge-green"}`}>{r.delta.toFixed(0)}%</span></td></tr>))}</tbody></table></div>
      </CardContent></Card>
    </div>
  </div>);
}