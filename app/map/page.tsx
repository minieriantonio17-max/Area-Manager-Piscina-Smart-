"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { loadDefaultData, groupBy, growthPerc, Client, SaleFact, provinceCenter } from "@/lib/utils";

function hasGoogleKey(){ return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY; }

export default function MapPage(){
  const [clients,setClients]=useState<Client[]>([]); const [sales,setSales]=useState<SaleFact[]>([]);
  const google = hasGoogleKey();
  useEffect(()=>{ loadDefaultData().then(({clients,sales})=>{ setClients(clients); setSales(sales); }); },[]);

  const comp = useMemo(()=>{
    const byCY = groupBy(sales,(s)=>`${s.client_id}-${s.year}`);
    return clients.map(c=>{
      const p=c.province?.toUpperCase().trim();
      const pos= p && provinceCenter[p]? provinceCenter[p]: null;
      const s25=(byCY[`${c.client_id}-2025`]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
      const s24=(byCY[`${c.client_id}-2024`]||[]).reduce((a,b)=>a+Number(b.amount||0),0);
      return {...c,pos,delta:growthPerc(s25,s24)};
    }).filter(x=>x.pos);
  },[clients,sales]);

  return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2"><CardHeader><CardTitle>Mappa Clienti</CardTitle></CardHeader><CardContent>
      {google? <GoogleMapWrapper comp={comp}/> : <OSMOverlay comp={comp}/>}
      <p className="subtle mt-2">Colore: verde=crescita, ambra=-5..-20%, rosso=&gt;20% calo.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Dettagli</CardTitle></CardHeader><CardContent>
      <ul className="space-y-2 text-sm">{comp.slice(0,20).map((c:any,i:number)=>(<li key={i} className="border rounded-2xl p-2"><div className="font-medium">{c.client_name}</div><div className="text-gray-500">{c.province||"N/D"} • Δ {c.delta.toFixed(0)}%</div></li>))}</ul>
    </CardContent></Card>
  </div>);
}

function OSMOverlay({comp}:{comp:any[]}){
  return (<div className="relative h-[520px] w-full rounded-2xl overflow-hidden border">
    <iframe title="Italia map" className="absolute inset-0 w-full h-full" src="https://www.openstreetmap.org/export/embed.html?bbox=6.0,36.0,19.0,47.0&layer=mapnik"/>
    <div className="absolute inset-0 pointer-events-none">
      {comp.map((c:any,idx:number)=>{ const x=((c.pos!.lng-6)/(19-6))*100; const y=(1-(c.pos!.lat-36)/(47-36))*100;
        const bg=c.delta<-20?"bg-red-600":c.delta<-5?"bg-amber-500":"bg-green-600";
        return (<div key={idx} className="absolute" style={{left:`calc(${x}% - 8px)`, top:`calc(${y}% - 8px)`}}><div className={`w-4 h-4 rounded-full ring-2 ring-white ${bg}`} title={`${c.client_name} (${c.delta.toFixed(0)}%)`}/></div>);})}
    </div>
  </div>);
}

function GoogleMapWrapper({comp}:{comp:any[]}){
  const { GoogleMap, Marker } = require("@react-google-maps/api");
  return (<div className="h-[520px] w-full rounded-2xl overflow-hidden border">
    <GoogleMap mapContainerStyle={{width:"100%",height:"100%"}} center={{lat:43.5,lng:12.5}} zoom={6}>
      {comp.map((c:any,idx:number)=>(<Marker key={idx} position={c.pos!} label={{text:c.province||"", color:"#000"}}/>))}
    </GoogleMap>
  </div>);
}