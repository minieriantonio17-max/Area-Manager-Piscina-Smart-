
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseCSV, fmtEUR, groupBy, growthPerc, getVisits, Client, SaleFact } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "@/components/charts";

async function loadAll(){
  const [cm,sf] = await Promise.all([
    fetch("/data/clients_master.csv").then(r=>r.text()).then(parseCSV<Client>),
    fetch("/data/sales_facts.csv").then(r=>r.text()).then(parseCSV<SaleFact>)
  ]);
  return {clients: cm, sales: sf.map(s=>({...s, year:Number(s.year), month: s.month? Number(s.month): null, amount:Number(s.amount)}))};
}

export default function ClientPage({ params }: { params: { id: string } }){
  const id = params.id;
  const [clients,setClients]=useState<Client[]>([]);
  const [sales,setSales]=useState<SaleFact[]>([]);
  useEffect(()=>{ loadAll().then(d=>{setClients(d.clients); setSales(d.sales);}); },[]);

  const client = useMemo(()=> clients.find(c=>String(c.client_id)===String(id)), [clients,id]);
  const visits = useMemo(()=> getVisits().filter(v=>v.client_id===id), [id]);
  const byYear = useMemo(()=> groupBy(sales.filter(s=>String(s.client_id)===String(id)), s=> String(s.year)), [sales,id]);
  const byMonth2025 = useMemo(()=> groupBy(sales.filter(s=>String(s.client_id)===String(id) && s.year===2025 && s.month!=null), s=> String(s.month)), [sales,id]);
  const v2024 = (byYear["2024"]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
  const v2025 = (byYear["2025"]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
  const delta = growthPerc(v2025, v2024);

  const pbiUrl = useMemo(()=> {
    if(!client) return "https://app.powerbi.com/groups/me/apps/b62e99d5-7dee-4b92-89e3-04a110f93da3/reports/e121694b-4e47-4f01-b234-f158ff06324f/ReportSection99bdfd5bb39c3569b7d5?experience=power-bi";
    const filter = encodeURIComponent("Clienti/Cliente eq '" + String(client.client_name).replace(/'/g, "''") + "'");
    return "https://app.powerbi.com/groups/me/apps/b62e99d5-7dee-4b92-89e3-04a110f93da3/reports/e121694b-4e47-4f01-b234-f158ff06324f/ReportSection99bdfd5bb39c3569b7d5?experience=power-bi" + "&filter=" + filter;
  }, [client]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="h1">{client?.client_name || "Cliente"}</h2>
          <div className="subtle">{client?.province || "N/D"} {client?.email? "• "+client.email: ""} {client?.phone? "• "+client.phone: ""}</div>
        </div>
        <Link className="link" href="/clients">← Torna all'elenco</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Andamento 2025 vs 2024</CardTitle></CardHeader><CardContent>
          <div className="text-3xl font-bold">{fmtEUR(v2025)} <span className="subtle ml-2">(Δ {delta.toFixed(1)}%)</span></div>
          <div className="subtle">2024: {fmtEUR(v2024)} • 2025: {fmtEUR(v2025)}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Alert</CardTitle></CardHeader><CardContent>
          <ul className="text-sm list-disc pl-5 space-y-2">
            {delta < -20 && <li className="text-red-700">Calo &gt; 20% vs 2024</li>}
            {visits.length===0 && <li className="text-amber-700">Nessuna visita registrata</li>}
            {delta >= -5 && <li className="text-green-700">Andamento stabile/in crescita</li>}
          </ul>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Contatti</CardTitle></CardHeader><CardContent>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">Email:</span> {client?.email || "N/D"}</div>
            <div><span className="text-gray-500">Telefono:</span> {client?.phone || "N/D"}</div>
            <div><span className="text-gray-500">Provincia:</span> {client?.province || "N/D"}</div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Storico mensile (se presente)</CardTitle></CardHeader><CardContent style={{height:320}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={Array.from({length:12}, (_,i)=>({month:i+1, value: (byMonth2025[String(i+1)]||[]).reduce((a,b)=>a+Number(b.amount||0),0)}))}>
              <XAxis dataKey="month"/><YAxis/><Tooltip/><Legend/>
              <Line type="monotone" dataKey="value" name="2025" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Visite</CardTitle></CardHeader><CardContent>
          <ul className="space-y-2 text-sm">
            {visits.map((v,i)=>(<li key={i} className="border rounded-2xl p-2"><div className="font-medium">{v.date}</div><div className="text-gray-500">{v.province || ""}</div></li>))}
            {visits.length===0 && <div className="text-gray-500">Nessuna visita registrata.</div>}
          </ul>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Power BI – Dettaglio cliente</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-2xl overflow-hidden border" style={{height:560}}>
            <iframe title="PowerBI" src={pbiUrl} width="100%" height="100%" allowFullScreen/>
          </div>
          <p className="subtle mt-2">Se il filtro non applica, verifica che il campo nel report corrisponda a <code>Clienti/Cliente</code>.
          In caso diverso, apri <code>app/client/[id]/page.tsx</code> e modifica il filtro nella costante <code>pbiUrl</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
