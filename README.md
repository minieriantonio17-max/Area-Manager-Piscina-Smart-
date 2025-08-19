# CRM AM • Pro+

UI moderna, pulita e **funzionante** con:
- Dashboard con **PDF export** e **alert intelligenti**
- Mappa clienti (Google Maps se presente `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, altrimenti OSM)
- Visite & Agenda (ICS + Outlook + **salvataggio visite** per analisi province)
- Clienti (filtri, storico 2023/24/25)
- Report (upload/archivio)

## Avvio
```bash
npm i
npm run dev
# http://localhost:3000
```

## Dati
`public/data/` include:
- `clients_master.csv`
- `sales_facts.csv`
- `semestre2025_gen.csv`

La Dashboard integra automaticamente i dati **Semestre 2025 vs 2024** nei KPI (matching per nome cliente).

## Google Maps (opzionale)
Aggiungi `.env.local` con:
```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=la-tua-api-key
```
Ribuild e la mappa userà Google Maps.

## Deploy su Vercel
Collega il repo e deploy. Per aggiornare i dati, sostituisci i CSV in `public/data/` o usa l'upload (in locale).

Buon lavoro! 🎯