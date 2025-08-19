"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { loadDefaultData, Client, addVisit } from "@/lib/utils";

function makeICS({title, description, location, start, end}:{title:string;description?:string;location?:string;start:Date;end:Date;}) {
  function fmt(dt: Date){const p=(n:number)=>String(n).padStart(2,"0"); return `${dt.getUTCFullYear()}${p(dt.getUTCMonth()+1)}${p(dt.getUTCDate())}T${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}00Z`; }
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CRM AM Pro//IT
BEGIN:VEVENT
UID:${Date.now()}@crm-am-pro
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:${title}
DESCRIPTION:${(description||"").replace(/\n/g,"\\n")}
LOCATION:${location||""}
END:VEVENT
END:VCALENDAR`;
}

export default function AgendaPage(){
  const [clients,setClients]=useState<Client[]>([]);
  const [clientId,setClientId]=useState(""); const [title,setTitle]=useState("Visita cliente");
  const [location,setLocation]=useState(""); const [desc,setDesc]=useState("Prodotti da proporre: Evo, pompe, ricambi.");
  const [date,setDate]=useState(""); const [timeStart,setTimeStart]=useState("09:00"); const [duration,setDuration]=useState(60);

  useEffect(()=>{ loadDefaultData().then(({clients})=>setClients(clients)); },[]);
  const client = useMemo(()=> clients.find(c=>c.client_id===clientId), [clients,clientId]);
  function downloadICS(){
    if(!date) return;
    const [hh,mm]=timeStart.split(":").map(Number); const start=new Date(date+"T00:00:00"); start.setHours(hh,mm,0,0);
    const end=new Date(start.getTime()+duration*60000);
    const blob=new Blob([makeICS({title,description:desc,location:location||client?.client_name,start,end})],{type:"text/calendar;charset=utf-8"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="visita.ics"; a.click(); URL.revokeObjectURL(url);
    if(client) addVisit({client_id:client.client_id,date,province:client.province});
    alert("Visita salvata nel registro locale per le analisi di presidio province.");
  }
  function outlookLink(){ const base="https://outlook.office.com/calendar/0/deeplink/compose"; const p=new URLSearchParams({path:"/calendar/action/compose",subject:title,body:desc,location:location||`${client?.client_name||""} (${client?.province||""})`}); return `${base}?${p.toString()}`; }

  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card><CardHeader><CardTitle>Nuova visita</CardTitle></CardHeader><CardContent className="space-y-3">
      <div><label className="text-sm text-gray-600">Cliente</label>
        <select className="input" value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— seleziona cliente —</option>
          {clients.map(c=>(<option key={c.client_id} value={c.client_id}>{c.client_name} {c.province?`(${c.province})`:""}</option>))}
        </select></div>
      <div><label className="text-sm text-gray-600">Titolo</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/></div>
      <div><label className="text-sm text-gray-600">Luogo</label><input className="input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Cliente / Indirizzo"/></div>
      <div><label className="text-sm text-gray-600">Data</label><input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm text-gray-600">Ora inizio</label><input type="time" className="input" value={timeStart} onChange={e=>setTimeStart(e.target.value)}/></div>
        <div><label className="text-sm text-gray-600">Durata (min)</label><input type="number" className="input" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></div>
      </div>
      <div><label className="text-sm text-gray-600">Note / Prodotti da proporre</label><textarea className="input" rows={4} value={desc} onChange={e=>setDesc(e.target.value)}/></div>
      <div className="flex gap-3">
        <button onClick={downloadICS} className="rounded-2xl px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white shadow-soft">Scarica .ICS + salva visita</button>
        <a className="rounded-2xl px-4 py-2 bg-gray-900 text-white shadow-soft" href={outlookLink()} target="_blank">Apri in Outlook</a>
      </div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Clienti vicini (stessa provincia)</CardTitle></CardHeader><CardContent>
      {!client && <div className="subtle">Seleziona un cliente per vedere chi puoi abbinare nello stesso giro.</div>}
      <ul className="space-y-2 text-sm">
        {clients.filter(c=>client&&c.client_id!==client.client_id&&c.province===client.province).slice(0,5).map((c,i)=>(
          <li key={i} className="border rounded-2xl p-2 flex items-center justify-between"><div><div className="font-medium">{c.client_name}</div><div className="text-gray-500">{c.province||"N/D"}</div></div><a className="link" href={`mailto:${c.email||""}`}>Email</a></li>
        ))}
      </ul>
    </CardContent></Card>
  </div>);
}