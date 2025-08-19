"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type ReportItem = { name: string; url: string; date: string };

export default function ReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);

  useEffect(()=>{
    const saved = localStorage.getItem("reports");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    const item: ReportItem = { name: file.name, url, date: new Date().toISOString().slice(0,10) };
    const updated = [item, ...items];
    setItems(updated);
    localStorage.setItem("reports", JSON.stringify(updated));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Carica report settimanale (PDF/Excel)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="block">
            <input type="file" className="hidden" onChange={onUpload} />
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center cursor-pointer hover:bg-gray-50">
              Trascina o clicca per caricare
            </div>
          </label>
          <p className="subtle">Suggerimento: usa il bottone “Esporta PDF” in Dashboard per generare il riassunto.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Archivio</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {items.map((it, i)=>(
              <li key={i} className="border rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-gray-500">{it.date}</div>
                </div>
                <a className="link" href={it.url} target="_blank">Apri</a>
              </li>
            ))}
            {!items.length && <div className="text-gray-500">Nessun report caricato.</div>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}