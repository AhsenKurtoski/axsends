# 🛒 AxsenDS

Piattaforma personale di automazione dropshipping + affiliate — alternativa self-hosted e gratuita a strumenti tipo AutoDS: ricerca prodotti reali, radar automatico dei vincenti, generazione di video ads con AI e pubblicazione su TikTok e YouTube.
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase, UI glass / dark mode.

> ⚡ Funziona da subito con dati demo (zero configurazione). Aggiungi le chiavi per dati reali e automazioni complete.

## ✨ Funzionalità

- 📡 **Radar prodotti vincenti** — scansione automatica multi-nicchia su CJ (cron giornaliero)
- 🚀 **Ricerca prodotti** — punteggio potenziale 0-100
- 📈 **Trend virali** — classifica per domanda
- ⚡ **Centro automazioni** — 19 automazioni con un click
- 🏷️ **Regole di prezzo** — markup, margine minimo, .99
- 📝 **Descrizione + SEO AI**
- 🎬 **AI Ads** — script, storyboard, copy, immagine e video (Hugging Face)
- 🎥 **Pubblicazione TikTok e YouTube** — API ufficiali
- 💵 **Affiliate** — gestione link + generatore di contenuti e disclosure
- 🔔 **Monitoraggio** prezzi/stock con cron
- 🚚 Fornitori · 🛍️ Ordini · 📊 Analytics

## 🚀 Avvio rapido (demo, zero config)

```bash
git clone https://github.com/AxsenXzc/axsends.git
cd axsends
npm install
npm run dev
```

Apri http://localhost:3000

## 🔄 Come aggiornare i file che hai gia

Dalla cartella del progetto:

```bash
git pull
npm install
npm run dev
```

## 🔑 Prodotti reali con CJ Dropshipping (gratis)

1. Registrati su cjdropshipping.com
2. **My CJ > Authorization > API** e copia la **API Key**
3. Crea `.env.local` con `CJ_EMAIL` e `CJ_API_KEY`
4. Riavvia `npm run dev`

## 🎬 AI Ads (Hugging Face)

Token gratuito su https://huggingface.co/settings/tokens, poi `HUGGINGFACE_API_TOKEN=hf_xxx` in `.env.local`.

## 🎥 Pubblicazione TikTok

Usa la **Content Posting API**. Richiede un'app su https://developers.tiktok.com approvata per lo scope **video.publish**, l'OAuth del tuo account e `TIKTOK_ACCESS_TOKEN` in `.env.local`. Senza app approvata i video restano privati. TikTok Shop richiede l'approvazione come TikTok Shop Partner.

## 📺 Pubblicazione YouTube

Usa la **YouTube Data API v3** (resumable upload). Richiede un progetto Google Cloud con la API attiva, OAuth scope **youtube.upload** e `YOUTUBE_ACCESS_TOKEN` in `.env.local`. Da progetti non verificati i video restano privati finche non superi l'audit Google.

## 💵 Affiliate

Gestisci i link affiliati (Amazon, CJ Affiliate, Awin, AliExpress, Impact) e genera caption, hashtag e disclosure pronti all'uso. I guadagni mostrati sono stime manuali.

## 🔌 API

| Endpoint | Metodo | Descrizione |
|---|---|---|
| /api/radar | GET | Scansione automatica multi-nicchia + winning score |
| /api/research | GET | Ricerca prodotti CJ + score |
| /api/describe | POST | Descrizione prodotto + SEO |
| /api/affiliate | POST | Contenuti + disclosure per link affiliati |
| /api/import | POST | Importa prodotti con markup |
| /api/orders | GET/POST | Lista o crea ordini |
| /api/fulfill | POST | Prepara evasione ordine per CJ |
| /api/monitor | GET | Snapshot prezzi/stock (cron) |
| /api/generate-ad | POST | Script, copy e immagine dell'ad |
| /api/generate-video | POST | Video ad (Hugging Face) |
| /api/tiktok | POST | Pubblica un video su TikTok |
| /api/youtube | POST | Carica un video su YouTube |

## 💰 Nota onesta sui guadagni

Il software automatizza ricerca prodotti, prezzi, contenuti, pubblicazione e affiliate, ma **nessuno strumento può garantire guadagni fissi**: dipende dal budget pubblicitario, dal traffico e dall'esecuzione. Diffida di chi promette guadagni garantiti.

## ☁️ Deploy

Importa il repo su Vercel, inserisci le variabili d'ambiente, deploy.
