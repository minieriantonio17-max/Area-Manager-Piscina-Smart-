
"use client";
import React, {useEffect, useState} from "react";
import Link from "next/link";
import { parseCSV } from "@/lib/utils";

export default function ClientsPage(){
  const [rows,setRows] = useState([]);
  useEffect(()=>{
    fetch("/data/clients_master.csv").then(r=>r.text()).then(parseCSV).then(setRows).catch(console.error);
  },[]);

  return (
    <div>
      <h1 className="h1">Clienti</h1>
      <table className="table">
        <thead><tr><th>Cliente</th><th>Provincia</th><th>Email</th><th>Telefono</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.client_id} id={r.client_id}>
              <td><Link className="link" href={`/client/${r.client_id}`}>{r.client_name}</Link></td>
              <td>{r.province||""}</td>
              <td>{r.email||""}</td>
              <td>{r.phone||""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
