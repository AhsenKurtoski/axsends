# 🛒 AxsenDS

Piattaforma personale di **automazione dropshipping** — alternativa self-hosted e gratuita a strumenti tipo AutoDS.
Costruita con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** e **Supabase**, con una UI **glass / dark mode** moderna.

> ⚡ Funziona da subito con dati demo (zero configurazione). Aggiungi le chiavi Supabase per passare ai dati reali.

## ✨ Funzionalità

- 📊 **Dashboard** con KPI (ricavi, ordini, margine) e grafici
- 📦 **Catalogo prodotti** con margini calcolati e stato stock
- 🛍️ **Ordini** e fulfillment
- 🚚 **Fornitori** (CJ Dropshipping, Temu, magazzini EU, AliExpress)
- 📈 **Analytics** ricavi vs costi e profitto
- 🔔 **Monitoraggio** prezzi/stock con cron automatico (ogni 6h)
- 🔌 **API reali**: import prodotti, ordini, monitor
- 🔐 **Autenticazione** Supabase (attiva quando configuri le chiavi)

## 🚀 Avvio rapido (modalità demo, zero config)

```bash
git clone https://github.com/AxsenXzc/axsends.git
cd axsends
npm install
npm run dev
```

Apri http://localhost:3000 — l'app parte con dati dimostrativi.

## 🔑 Attivare i dati reali (Supabase)

1. Crea un progetto gratuito su [supabase.com](https://supabase.com)
2. Apri **SQL Editor** e incolla/esegui il contenuto di `supabase/schema.sql`
3. Copia `.env.example` in `.env.local` e inserisci le tue chiavi
4. Riavvia `npm run dev`: le API leggono/scrivono su Supabase e l'autenticazione si attiva

## 🔌 API

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/products` | GET | Lista prodotti (Supabase o demo) |
| `/api/orders` | GET/POST | Lista o crea ordini |
| `/api/import` | POST | Importa prodotti dal fornitore (markup 2.5x) |
| `/api/monitor` | GET | Salva snapshot prezzi/stock (cron) |

## ⏱️ Cron (Vercel)

`vercel.json` pianifica `/api/monitor` ogni 6 ore.

## 🧱 Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · lucide-react · recharts · Supabase

## 📂 Struttura

```
app/            pagine e API (App Router)
components/     UI riutilizzabile
lib/            dati mock, tipi, client Supabase
supabase/       schema.sql (tabelle + seed + RLS)
middleware.ts   auth (attiva solo con Supabase configurato)
```

## ☁️ Deploy

1. Importa il repo su [vercel.com](https://vercel.com)
2. Inserisci le variabili d'ambiente
3. Deploy 🚀

## 📝 Note oneste

- L'app gira completamente con dati demo senza alcuna chiave.
- L'import reale dai fornitori richiede le tue credenziali API del fornitore.
- Supabase ha un piano gratuito sufficiente per uso personale.
