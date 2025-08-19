# CRM AM • PRO — Pacchetto Completo (FINAL)

Questo pacchetto include:
- App Next.js con **pagina cliente** e **embed Power BI** con filtro automatico sul nome cliente.
- Dati corretti in `public/data/`:
  - `clients_master.csv` (id, nome, provincia, email, telefono)
  - `sales_facts.csv` (client_id, client_name, year, month="", amount YTD)
- Stile grafico moderno, componenti robusti per Vercel.

## Avvio locale
```bash
npm i
npm run dev
# http://localhost:3000
```

## Deploy su Vercel
- Collega il repo a Vercel e fai push.
- (Facoltativo) Variabile `NEXT_PUBLIC_GOOGLE_MAPS_KEY` per mappa Google (OSM fallback già attivo).

## Test rapidi post-deploy
1. Apri `/data/clients_master.csv` e `/data/sales_facts.csv` sul dominio: devono mostrare contenuti (non 404).
2. Vai su `/clients` e clicca un **nome cliente** → si apre `/client/{id}` con:
   - Anagrafica + contatti
   - Box L&F 2025 vs 2024
   - Elenco visite (registro locale)
   - **Iframe Power BI** filtrato sul cliente

## Filtro Power BI
Nel file `app/client/[id]/page.tsx` la costante `pbiUrl` usa:
`&filter=Clienti/Cliente eq 'NOME CLIENTE'`  
Se nel tuo report il campo si chiama diversamente, cambia `Clienti/Cliente` con il nome corretto.

## Aggiornamento dati mensile (consigliato)
- Sostituisci solo i CSV in `public/data/`:
  - **clients_master.csv** (anagrafica aggiornata)
  - **sales_facts.csv** (aggiungi/aggiorna righe con year=2025 e month="" come YTD oppure crea storico mensile con colonna month 1..12)
- Push → Vercel redeploy automatico.

## Troubleshooting
- Se la build si ferma su Recharts o TS, il progetto ha già `ignoreBuildErrors` e import client-only.  
- Se l'iframe Power BI non filtra, assicurati che il **nome del campo** nel report coincida con quello del filtro.