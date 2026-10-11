# 🛒 AhsenDS — Costruito da Ahsen Kurtoski

Piattaforma avanzata e autonoma di automazione dropshipping + affiliate marketing — **ideata, progettata e costruita interamente da Ahsen Kurtoski**.
Alternativa moderna, self-hosted e completa a strumenti come AutoDS: include ricerca prodotti reali, radar automatico dei vincenti, generazione di video ads con intelligenza artificiale, web studio per landing page da 10.000€ e pubblicazione automatica su TikTok, Instagram, Facebook e YouTube.

Tecnologie: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**, interfaccia ultra-moderna in dark mode con glassmorphism.

> ⚡ **Sviluppato con eccellenza da Ahsen Kurtoski.**
> Funziona immediatamente con dati reali (CJ Dropshipping, AI Groq/OpenRouter/Gemini, Supabase) o in modalità demo guidata a zero configurazione.

---

## 👨‍💻 Creatore & Architetto del Software
- **Sviluppatore**: **Ahsen Kurtoski**
- **Ruolo**: Fullstack & AI Systems Architect
- **Software**: AhsenDS (Dropshipping Automation OS)
- **Repository**: [AhsenDS](https://github.com/AhsenKurtoski/ahsends.git)

---

## ✨ Funzionalità Principali

- 📡 **Radar prodotti vincenti** — Scansione automatica multi-nicchia su CJ Dropshipping con cron giornaliero.
- 🚀 **Ricerca prodotti con AI Scoring** — Algoritmo proprietario che calcola un punteggio di potenziale da 0 a 100.
- 📈 **Trend virali** — Monitoraggio delle categorie ed elementi ad alta richiesta.
- ⚡ **Centro automazioni (47+ automazioni)** — Attivazione e gestione flussi con un clic.
- 🏷️ **Regole di prezzo dinamiche** — Markup intelligente, margine minimo protetto, arrotondamento psicologico a .99.
- 📝 **Copywriting & Schede Prodotto AI** — Generazione testi SEO persuasivi senza template fissi.
- 🎬 **AI Ads Generator** — Script, storyboard scena per scena, copy ad alta conversione, fotogrammi AI (Hugging Face).
- 🎥 **Pubblicazione Multi-Piattaforma** — Integrazione con API ufficiali di TikTok, YouTube, Instagram e Facebook.
- 🌐 **Web Studio Premium** — Generatore autonomo di landing page e siti web completi da agenzia lusso in un singolo file HTML.
- 🤖 **Autopilot in 1 Clic** — Trova il miglior prodotto, lo salva nel catalogo, scrive l'ad virale e costruisce la landing page.
- 💵 **Affiliate & Centro Guadagni** — Generatore link con disclosure legale e 17 metodi di monetizzazione pronti all'uso.
- 🔔 **Monitoraggio Prezzi & Stock** — Cron automatico per evitare vendite sotto costo o prodotti esauriti.
- 🚚 **Gestione Fornitori · 🛍️ Ordini · 📊 Analytics in tempo reale**.

---

## 🚀 Avvio Rapido

```bash
git clone https://github.com/AhsenKurtoski/ahsends.git
cd AhsenDS
npm install
npm run dev
```

Apri `http://localhost:3000` nel tuo browser.

---

## 🔄 Come aggiornare il progetto

Dalla cartella del progetto:

```bash
git pull
npm install
npm run dev
```

---

## 🔑 Configurazione Servizi e Chiavi API

Crea un file `.env.local` nella cartella principale prendendo come riferimento `.env.example`:

1. **CJ Dropshipping (gratuito)**:
   - Registrati su [cjdropshipping.com](https://cjdropshipping.com)
   - Vai in **My CJ > Authorization > API** e copia la tua API Key.
   - Inserisci `CJ_EMAIL` e `CJ_API_KEY` in `.env.local`.

2. **Intelligenza Artificiale (testi, script e siti)**:
   - **Groq** (gratis e velocissimo): crea la chiave su [console.groq.com/keys](https://console.groq.com/keys) -> `GROQ_API_KEY`.
   - **Gemini** (Google AI Studio): crea la chiave su [aistudio.google.com](https://aistudio.google.com/app/apikey) -> `GEMINI_API_KEY`.
   - **OpenRouter** (modelli free avanzati): [openrouter.ai/keys](https://openrouter.ai/keys) -> `OPENROUTER_API_KEY`.

3. **Database Supabase**:
   - Crea un progetto su [supabase.com](https://supabase.com).
   - Apri **SQL Editor**, incolla il contenuto di `supabase-schema.sql` e premi **Run**.
   - Inserisci `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

4. **Fotogrammi & Immagini AI (Hugging Face)**:
   - Token gratuito su [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) -> `HUGGINGFACE_API_TOKEN`.

---

## 🔌 API Endpoints

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/api/autopilot` | GET | Esecuzione completa Autopilot (ricerca + catalogo + ad + landing) |
| `/api/radar` | GET | Scansione automatica multi-nicchia con calcolo score |
| `/api/research` | GET | Ricerca prodotti su CJ Dropshipping con punteggio |
| `/api/describe` | POST | Scheda prodotto persuasiva + tag SEO |
| `/api/affiliate` | POST | Contenuti promozionali + disclosure per link affiliati |
| `/api/import` | POST | Importazione prodotti con ricarico prezzi automatico |
| `/api/orders` | GET / POST | Gestione ordini su database protetto da RLS |
| `/api/suppliers` | GET | Elenco fornitori verificati |
| `/api/fulfill` | POST | Preparazione evasione ordine verso CJ |
| `/api/monitor` | GET | Snapshot periodico prezzi e stock per cron jobs |
| `/api/generate-ad` | POST | Script storyboard, copy persuasivo e prompt creativo |
| `/api/generate-video` | POST | Fotogrammi verticali pubblicitari via Hugging Face |
| `/api/website` | POST | Generazione sito web e landing page completa |
| `/api/tiktok` | POST | Pubblicazione video su TikTok |
| `/api/youtube` | POST | Caricamento video Shorts su YouTube |
| `/api/health` | GET | Diagnostica in tempo reale di tutte le chiavi e servizi |

---

## 💎 Crediti e Licenza

Software ideato, sviluppato e manutenuto da **Ahsen Kurtoski**.  
Tutti i diritti riservati.
