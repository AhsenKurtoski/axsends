# 🛒 AxsenDS

Piattaforma personale di automazione dropshipping — alternativa self-hosted e gratuita a strumenti tipo AutoDS, con ricerca prodotti reali e generazione di video ads tramite AI.
Costruita con Next.js 14 (App Router), TypeScript, Tailwind CSS e Supabase, con una UI glass / dark mode moderna.

> ⚡ Funziona da subito con dati demo (zero configurazione). Aggiungi le chiavi per dati reali e AI.

## ✨ Funzionalità

- 📊 Dashboard con KPI e grafici
- 🚀 Ricerca prodotti vincenti (CJ Dropshipping) con punteggio di potenziale 0-100
- 📦 Catalogo prodotti con margini e stock
- 🛍️ Ordini e fulfillment
- 🚚 Fornitori (CJ Dropshipping, Temu, magazzini EU, AliExpress)
- 📈 Analytics ricavi vs costi
- 🔔 Monitoraggio prezzi/stock con cron (ogni 6h)
- 🎬 AI Ads Generator: script, storyboard, copy, immagine e video con Hugging Face
- 🔌 API reali: ricerca, import, ordini, monitor, generazione ad e video
- 🔐 Autenticazione Supabase

## 🚀 Avvio rapido (demo, zero config)

```bash
git clone https://github.com/AxsenXzc/axsends.git
cd axsends
npm install
npm run dev
```

Apri http://localhost:3000

## 🚀 Ricerca prodotti vincenti (CJ Dropshipping)

La pagina **Ricerca prodotti** cerca prodotti reali su CJ Dropshipping e li ordina con un **punteggio di potenziale** (0-100) calcolato su:
- margine potenziale (prezzo consigliato = costo x2.8)
- fascia di prezzo ottimale per impulso d'acquisto (15-60 EUR)
- domanda/popolarità del prodotto

Funziona in modalità demo senza credenziali. Per i prodotti reali crea un account gratuito su cjdropshipping.com, prendi la API Key (My CJ > Authorization > API) e aggiungi in .env.local:

```bash
CJ_EMAIL=la-tua-email
CJ_API_KEY=la-tua-api-key
```

## 🎬 AI Ads Generator

Genera contenuti per i tuoi video ads con AI:
- Hook, storyboard scena per scena e voiceover
- Caption e hashtag per TikTok / Reels / Shorts
- Creatività immagine (text-to-image, Hugging Face)
- Video AI (text-to-video, Hugging Face)

Funziona in demo (script + storyboard) anche senza token. Per immagine e video aggiungi HUGGINGFACE_API_TOKEN in .env.local (token gratuito: https://huggingface.co/settings/tokens).

## 🔑 Dati reali (Supabase)

1. Crea un progetto gratuito su https://supabase.com
2. Apri SQL Editor ed esegui supabase/schema.sql
3. Copia .env.example in .env.local con le tue chiavi
4. Riavvia npm run dev

## 🔌 API

| Endpoint | Metodo | Descrizione |
|---|---|---|
| /api/research | GET | Ricerca prodotti CJ + winning score |
| /api/products | GET | Lista prodotti |
| /api/orders | GET/POST | Lista o crea ordini |
| /api/import | POST | Importa prodotti (markup 2.8x) |
| /api/monitor | GET | Snapshot prezzi/stock (cron) |
| /api/generate-ad | POST | Script, copy e immagine dell'ad |
| /api/generate-video | POST | Video ad (Hugging Face) |

## 🧱 Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · lucide-react · recharts · Supabase · CJ Dropshipping API · Hugging Face

## ☁️ Deploy

1. Importa il repo su https://vercel.com
2. Inserisci le variabili d'ambiente
3. Deploy

## 📝 Note oneste

- L'app gira completamente con dati demo senza alcuna chiave.
- Prodotti reali: serve un account gratuito CJ Dropshipping (come fa anche AutoDS dietro le quinte).
- AI Ads: script e storyboard funzionano sempre; immagine e video richiedono un token Hugging Face gratuito.
