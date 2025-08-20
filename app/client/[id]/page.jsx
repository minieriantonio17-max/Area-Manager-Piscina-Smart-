
"use client";
import React, {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseCSV, fmtEUR, groupBy, growthPerc } from "@/lib/utils";

function Bars({value2024, value2025}){
  const max = Math.max(value2024, value2025, 1);
  const h = 120;
  const w = 280;
  const barW = 80;
  const pad = 30;
  const y2024 = h - (value2024/max)*h;
  const y2025 = h - (value2025/max)*h;
  return (
    <svg width={w} height={h+30}>
      <rect x={pad} y={y2024} width={barW} height={h - y2024} fill="#93c5fd"></rect>
      <rect x={pad+barW+40} y={y2025} width={barW} height={h - y2025} fill="#60a5fa"></rect>
      <text x={pad+barW/2} y={h+20} textAnchor="middle" fontSize="12">2024</text>
      <text x={pad+barW+40+barW/2} y={h+20} textAnchor="middle" fontSize="12">2025</text>
    </svg>
  );
}

export default function ClientPage({params}){
  const id = params.id;
  const [clients,setClients] = useState([]);
  const [facts,setFacts] = useState([]);
  useEffect(()=>{
    Promise.all([
      fetch("/data/clients_master.csv").then(r=>r.text()).then(parseCSV),
      fetch("/data/sales_facts.csv").then(r=>r.text()).then(parseCSV)
    ]).then(([c,f])=>{
      setClients(c);
      setFacts(f.map(x=>({...x, year:Number(x.year), amount:Number(x.amount||0)})));
    }).catch(console.error);
  },[]);

  const client = useMemo(()=> clients.find(c=>String(c.client_id)===String(id)), [clients,id]);
  const v2024 = useMemo(()=> (facts||[]).filter(x=>String(x.client_id)===String(id) && x.year===2024).reduce((a,b)=>a+Number(b.amount||0),0), [facts,id]);
  const v2025 = useMemo(()=> (facts||[]).filter(x=>String(x.client_id)===String(id) && x.year===2025).reduce((a,b)=>a+Number(b.amount||0),0), [facts,id]);
  const delta = growthPerc(v2025, v2024);

  const pbiUrl = useMemo(()=>{
    if(!client) return "https://app.powerbi.com/groups/me/apps/b62e99d5-7dee-4b92-89e3-04a110f93da3/reports/e121694b-4e47-4f01-b234-f158ff06324f/ReportSection99bdfd5bb39c3569b7d5?experience=power-bi";
    const filter = encodeURIComponent("Clienti/Cliente eq '" + String(client.client_name).replace(/'/g, "''") + "'");
    return "https://app.powerbi.com/groups/me/apps/b62e99d5-7dee-4b92-89e3-04a110f93da3/reports/e121694b-4e47-4f01-b234-f158ff06324f/ReportSection99bdfd5bb39c3569b7d5?experience=power-bi" + "&filter=" + filter;
  }, [client]);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 className="h1">{client?.client_name || "Cliente"}</h1>
          <div className="subtle">{client?.province||"N/D"} {client?.email? "• "+client.email:""} {client?.phone? "• "+client.phone:""}</div>
        </div>
        <Link className="link" href="/clients">← Torna all'elenco</Link>
      </div>

      <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)", marginTop:16}}>
        <Card><CardHeader><CardTitle>Andamento 2025 vs 2024</CardTitle></CardHeader><CardContent>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <Bars value2024={v2024} value2025={v2025}/>
            <div>
              <div><b>2024:</b> {fmtEUR(v2024)}</div>
              <div><b>2025:</b> {fmtEUR(v2025)}</div>
              <div><b>Δ%:</b> {delta.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Alert</CardTitle></CardHeader><CardContent>
          <ul className="subtle" style={{lineHeight:"1.6"}}>
            {delta < -20 && <li style={{color:"#b91c1c"}}>Calo &gt; 20% vs 2024</li>}
            {delta >= -20 && <li style={{color:"#166534"}}>Andamento ok</li>}
          </ul>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Visite</CardTitle></CardHeader><CardContent>
          <div className="subtle">Vedi foglio Excel "Visite Pianificate".</div>
        </CardContent></Card>
      </div>

      <Card style={{marginTop:16}}>
        <CardHeader><CardTitle>Power BI – Dettaglio cliente</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-2xl" style={{height:560,border:"1px solid #e5e7eb",overflow:"hidden"}}>
            <iframe title="PowerBI" src={pbiUrl} width="100%" height="100%" allowFullScreen/>
          </div>
          <p className="subtle" style={{marginTop:8}}>Se il filtro non si applica, cambia il nome del campo nel filtro URL in <code>app/client/[id]/page.jsx</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
