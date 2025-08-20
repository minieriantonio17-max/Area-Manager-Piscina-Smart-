
# CRM Manager – Pacchetto Finale

- **Excel consolidato**: `CRM_MASTER_DATA.xlsx` (Anagrafica, Fatturati Generali, Fatturati Specialist, Dashboard Data, Visite Pianificate)
- **Web App Next.js** (nessuna dipendenza fragile): Dashboard, Elenco Clienti, Scheda Cliente con **Power BI embed**
- **Dati CSV** in `public/data/` coerenti con l'Excel

## Avvio locale
```
npm i
npm run dev
# http://localhost:3000
```

## Deploy Vercel
- Importa la cartella su GitHub, collega a Vercel e deploy.
- Verifica che non diano 404:
  - /data/clients_master.csv
  - /data/sales_facts.csv

## Aggiornamento mensile
- Sostituisci i due CSV in `public/data/` con gli aggiornati (stessa struttura).
- Se lavori in Power BI, carica l'Excel `CRM_MASTER_DATA.xlsx` e usa **Dashboard Data** come tabella principale.

## Power BI
- L'iframe della scheda cliente filtra tramite `&filter=Clienti/Cliente eq 'NOME CLIENTE'`.
- Se il tuo campo cliente ha un nome diverso, modifica `pbiUrl` in `app/client/[id]/page.jsx`.
