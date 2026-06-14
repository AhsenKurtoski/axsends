# 🛒 AxsenDS

Piattaforma personale di automazione dropshipping — alternativa self-hosted e gratuita a strumenti tipo AutoDS: ricerca prodotti reali, radar automatico dei vincenti, generazione di video ads con AI e pubblicazione su TikTok.
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase, UI glass / dark mode.

> ⚡ Funziona da subito con dati demo (zero configurazione). Aggiungi le chiavi per dati reali e automazioni complete.

## ✨ Funzionalità

- 📡 **Radar prodotti vincenti** — scansione automatica multi-nicchia su CJ (cron giornaliero)
- 🚀 **Ricerca prodotti** — punteggio potenziale 0-100
- 📈 **Trend virali** — classifica per domanda
- ⚡ **Centro automazioni** — 17 automazioni con un click
- 🏷️ **Regole di prezzo** — markup, margine minimo, .99
- 📝 **Descrizione + SEO AI**
- 🎬 **AI Ads** — script, storyboard, copy, immagine e video (Hugging Face)
- 🎥 **Pubblicazione TikTok** — Content Posting API
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

Se hai gia il progetto in locale, dalla cartella del progetto:

```bash
git pull
npm install
npm run dev
```

## 🔑 Prodotti reali con CJ Dropshipping (gratis)

1. Registrati su cjdropshipping.com
2. **My CJ > Authorization > API** e copia la **API Key**
3. Crea `.env.local`:
   ```
   CJ_EMAIL=la-tua-email
   CJ_API_KEY=la-tua-api-key
   ```
4. Riavvia `npm run dev`

## 🎬 AI Ads (Hugging Face)

Token gratuito su https://huggingface.co/settings/tokens, poi in `.env.local`:
```
HUGGINGFACE_API_TOKEN=hf_xxx
```

## 🎥 Pubblicazione TikTok

La pubblicazione automatica usa la **Content Posting API** di TikTok. Richiede:
1. Un'app su https://developers.tiktok.com approvata per lo scope **video.publish**
2. L'autorizzazione OAuth del tuo account TikTok e il relativo **access token**
3. In `.env.local`:
   ```
   TIKTOK_ACCESS_TOKEN=il-tuo-token
   ```

Nota: senza app approvata i video restano in modalita privata (SELF_ONLY). TikTok Shop richiede in aggiunta l'approvazione come TikTok Shop Partner.

## 🔌 API

| Endpoint | Metodo | Descrizione |
|---|---|---|
| /api/radar | GET | Scansione automatica multi-nicchia + winning score |
| /api/research | GET | Ricerca prodotti CJ + score (sort=score/trending/margin) |
| /api/describe | POST | Descrizione prodotto + titolo SEO + tag |
| /api/import | POST | Importa prodotti con markup |
| /api/orders | GET/POST | Lista o crea ordini |
| /api/fulfill | POST | Prepara evasione ordine per CJ |
| /api/monitor | GET | Snapshot prezzi/stock (cron) |
| /api/generate-ad | POST | Script, copy e immagine dell'ad |
| /api/generate-video | POST | Video ad (Hugging Face) |
| /api/tiktok | POST | Pubblica un video su TikTok |

## 💰 Nota onesta sui guadagni

Il software automatizza ricerca prodotti, prezzi, contenuti e gestione, ma **nessuno strumento può garantire un guadagno fisso** (es. 2.000€/mese): dipende dal budget pubblicitario e dall'esecuzione.

## ☁️ Deploy

Importa il repo su Vercel, inserisci le variabili d'ambiente, deploy.
