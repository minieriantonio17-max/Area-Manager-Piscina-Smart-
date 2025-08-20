
"use client";
import React, {useEffect, useMemo, useState} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseCSV, fmtEUR, groupBy, growthPerc } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard(){
  const [clients, setClients] = useState([]);
  const [facts, setFacts] = useState([]);
  useEffect(()=>{
    Promise.all([
      fetch("/data/clients_master.csv").then(r=>r.text()).then(parseCSV),
      fetch("/data/sales_facts.csv").then(r=>r.text()).then(parseCSV)
    ]).then(([c,f])=>{
      setClients(c);
      setFacts(f.map(x=>({...x, year:Number(x.year), amount:Number(x.amount||0)})));
    }).catch(console.error);
  },[]);

  const byYear = useMemo(()=> groupBy(facts, x=>String(x.year)), [facts]);
  const v2024 = (byYear["2024"]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
  const v2025 = (byYear["2025"]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
  const delta = growthPerc(v2025, v2024);

  return (
    <div className="grid">
      <h1 className="h1">Dashboard Fatturato</h1>
      <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        <Card><CardHeader><CardTitle>Totale 2024</CardTitle></CardHeader><CardContent><div className="kpi"><div className="big">{fmtEUR(v2024)}</div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Totale 2025</CardTitle></CardHeader><CardContent><div className="kpi"><div className="big">{fmtEUR(v2025)}</div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Δ % 2025 vs 2024</CardTitle></CardHeader><CardContent><div className="kpi"><div className="big">{delta.toFixed(1)}%</div></div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Clienti in calo &gt; 20%</CardTitle></CardHeader><CardContent>
        <table className="table">
          <thead><tr><th>Cliente</th><th>2024</th><th>2025</th><th>Δ%</th></tr></thead>
          <tbody>
            {(clients||[]).map(c=>{
              const c2024 = (facts||[]).filter(x=>x.client_id===c.client_id && x.year===2024).reduce((a,b)=>a+Number(b.amount||0),0);
              const c2025 = (facts||[]).filter(x=>x.client_id===c.client_id && x.year===2025).reduce((a,b)=>a+Number(b.amount||0),0);
              const perc = (c2024===0? (c2025>0?100:0) : (c2025/c2024-1)*100);
              if (perc<=-20){
                return (<tr key={c.client_id}><td><Link className="link" href={`/clients#${c.client_id}`}>{c.client_name}</Link></td><td>{fmtEUR(c2024)}</td><td>{fmtEUR(c2025)}</td><td>{perc.toFixed(1)}%</td></tr>);
              }
              return null;
            })}
          </tbody>
        </table>
      
    </div>
  );
}
