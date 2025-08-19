import Link from "next/link";
"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { loadDefaultData, Client, SaleFact, fmtEUR, groupBy } from "@/lib/utils";

export default function ClientsPage(){
  const [clients,setClients]=useState<Client[]>([]); const [sales,setSales]=useState<SaleFact[]>([]); const [q,setQ]=useState("");
  useEffect(()=>{ loadDefaultData().then(({clients,sales})=>{ setClients(clients); setSales(sales); }); },[]);
  const rows=useMemo(()=>{
    const byCY=groupBy(sales,(s)=>`${s.client_id}-${s.year}`);
    return clients.filter(c=>(c.client_name?.toLowerCase().includes(q.toLowerCase())||(c.province||"").toLowerCase().includes(q.toLowerCase())))
      .map(c=>({ ...c,
        y2023:(byCY[`${c.client_id}-2023`]||[]).reduce((a,b)=>a+Number(b.amount||0),0),
        y2024:(byCY[`${c.client_id}-2024`]||[]).reduce((a,b)=>a+Number(b.amount||0),0),
        y2025:(byCY[`${c.client_id}-2025`]||[]).reduce((a,b)=>a+Number(b.amount||0),0)
      }));
  },[clients,sales,q]);
  return (<div className="space-y-6">
    <Card><CardHeader><CardTitle>Cerca clienti</CardTitle></CardHeader><CardContent><input className="input" placeholder="Nome cliente o provincia…" value={q} onChange={e=>setQ(e.target.value)}/></CardContent></Card>
    <Card><CardHeader><CardTitle>Elenco clienti</CardTitle></CardHeader><CardContent>
      <div className="overflow-auto"><table className="min-w-full text-sm"><thead className="text-left text-gray-500">
        <tr><th className="py-2 pr-4">Cliente</th><th className="py-2 pr-4">Provincia</th><th className="py-2 pr-4">Telefono</th><th className="py-2 pr-4">2023</th><th className="py-2 pr-4">2024</th><th className="py-2 pr-4">2025</th><th className="py-2 pr-4">Email</th></tr></thead>
        <tbody>{rows.map((r,i)=>(<tr key={i} className="border-t"><td className="py-2 pr-4">{<Link className="link" href={`/client/${r.client_id}`}>{r.client_name}</Link>}</td><td className="py-2 pr-4">{r.province||"-"}</td><td className="py-2 pr-4">{r.phone||"-"}</td><td className="py-2 pr-4">{fmtEUR(r.y2023||0)}</td><td className="py-2 pr-4">{fmtEUR(r.y2024||0)}</td><td className="py-2 pr-4">{fmtEUR(r.y2025||0)}</td><td className="py-2 pr-4">{r.email?<a className="link" href={`mailto:${r.email}`}>Invia email</a>:<span className="text-gray-400">N/D</span>}</td></tr>))}</tbody>
      </table></div>
    </CardContent></Card>
  </div>);
}