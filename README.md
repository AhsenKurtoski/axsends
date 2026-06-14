# 🛒 AxsenDS

Piattaforma personale di automazione dropshipping — alternativa self-hosted e gratuita a strumenti tipo AutoDS, con ricerca prodotti reali, radar automatico dei vincenti e generazione di video ads con AI.
Costruita con Next.js 14 (App Router), TypeScript, Tailwind CSS e Supabase, UI glass / dark mode.

> ⚡ Funziona da subito con dati demo (zero configurazione). Aggiungi le chiavi per dati reali e AI.

## ✨ Funzionalità principali

- 📡 **Radar prodotti vincenti**: scansione automatica multi-nicchia su CJ, classifica per potenziale (cron giornaliero)
- 🚀 **Ricerca prodotti**: ricerca CJ con punteggio 0-100 (margine, prezzo, domanda)
- 📈 **Trend virali**: classifica per domanda
- ⚡ **Centro automazioni**: 15 automazioni gestibili con un click
- 🏷️ **Regole di prezzo**: markup, margine minimo, arrotondamento .99
- 📝 **Descrizione + SEO AI**: schede prodotto generate automaticamente
- 🎬 **AI Ads Generator**: script, storyboard, copy, immagine e video (Hugging Face)
- 🔔 **Monitoraggio** prezzi/stock con cron
- 🚚 **Fornitori**, 🛍️ **Ordini** e 📊 **Analytics**

## ⚡ Le 15 automazioni

Radar vincenti · Punteggio potenziale · Auto-prezzo · Arrotondamento .99 · Analisi competitor · Trend virali · Caption + hashtag AI · Monitoraggio prezzi · Descrizione + SEO AI · Creativo immagine AI · Video ad AI · Monitoraggio stock · Auto-fulfillment ordini · Import automatico winners · Report giornaliero.

Le automazioni con AI richiedono un token Hugging Face gratuito; quelle su catalogo/ordini reali richiedono CJ e/o Supabase.

## 🚀 Avvio rapido (demo, zero config)

```bash
git clone https://github.com/AxsenXzc/axsends.git
cd axsends
npm install
npm run dev
```

Apri http://localhost:3000

## 🔑 Prodotti reali con CJ Dropshipping (gratis)

1. Registrati su cjdropshipping.com (account gratuito)
2. Vai in **My CJ > Authorization > API** e copia la **API Key**
3. Crea `.env.local`:
   ```
   CJ_EMAIL=la-tua-email
   CJ_API_KEY=la-tua-api-key
   ```
4. Riavvia `npm run dev` → Radar, Ricerca e Trend useranno i cataloghi reali

## 🎬 AI Ads (Hugging Face)

Token gratuito su https://huggingface.co/settings/tokens, poi in `.env.local`:
```
HUGGINGFACE_API_TOKEN=hf_xxx
```

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

## 🧱 Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · lucide-react · recharts · Supabase · CJ Dropshipping API · Hugging Face

## 💰 Nota onesta sui guadagni

Questo software automatizza ricerca prodotti, prezzi, contenuti e gestione ordini, ma **nessuno strumento può garantire un guadagno fisso** (es. 2.000€/mese): i risultati dipendono dal budget pubblicitario e dall'esecuzione. AxsenDS ti dà il motore migliore possibile; le vendite dipendono dal marketing.

## ☁️ Deploy

Importa il repo su Vercel, inserisci le variabili d'ambiente e fai deploy.
