# 🛒 AhsenDS — Costruito da Ahsen Kurtoski

Piattaforma avanzata e autonoma di automazione dropshipping + affiliate marketing — **ideata, progettata e costruita interamente da Ahsen Kurtoski**.
Alternativa moderna, self-hosted e completa a strumenti come AutoDS: include ricerca prodotti reali, radar automatico dei vincenti, generazione di video ads con intelligenza artificiale, web studio per landing page da 10.000€ e pubblicazione automatica su TikTok, Instagram, Facebook e YouTube.

Tecnologie: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**, interfaccia ultra-moderna in dark mode con glassmorphism.

> ⚡ **Sviluppato da Ahsen Kurtoski.**
> Usa servizi reali (CJ Dropshipping, Groq/OpenRouter/Gemini, Supabase). Senza chiavi l'interfaccia parte con le sezioni vuote (nessun dato inventato) e le API di generazione rispondono `503` indicando la variabile da impostare.

---

## 👨‍💻 Creatore & Architetto del Software
- **Sviluppatore**: **Ahsen Kurtoski**
- **Ruolo**: Fullstack & AI Systems Architect
- **Software**: AhsenDS (Dropshipping Automation OS)
- **Repository**: [AhsenDS](https://github.com/AhsenKurtoski/axsends.git)

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
- 🩺 **Diagnostica completa** — Stato reale di AI, Supabase, CJ e social, con verifica delle sei tabelle e istruzioni di riparazione.
- 🚚 **Gestione Fornitori · 🛍️ Ordini · 📊 Analytics in tempo reale**.

---

## 💸 Gratis e open source

- **Il software è gratuito**: licenza MIT, nessun abbonamento, nessuna funzione bloccata. Puoi usarlo, modificarlo e ridistribuirlo.
- **Nessuna simulazione**: se manca una chiave o un modello non risponde, l'API restituisce un errore esplicito (`503`/`502`) con il nome della variabile da impostare. Non viene generato contenuto finto.
- **Servizi opzionali con piano gratuito**: Groq/OpenRouter/Gemini (testi), Supabase (database e login), CJ Dropshipping (prodotti), Hugging Face (immagini). I limiti restano quelli dei rispettivi provider.
- **Nessun guadagno garantito**: il software automatizza il lavoro, non i risultati.

---

## 🚀 Avvio Rapido

Requisiti: **Node.js 18.17+** e npm.

```bash
git clone https://github.com/AhsenKurtoski/axsends.git
cd ahsends
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Apri `http://localhost:3000` per la landing pubblica, `http://localhost:3000/launch` per il launch kit (film, teaser 9:16, screenshot e download), `http://localhost:3000/app` per la dashboard.

Se Supabase è configurato l'accesso è obbligatorio: crea il tuo utente in **Supabase > Authentication > Users** e accedi da `/login`.

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

Crea un file `.env.local` nella cartella principale prendendo come riferimento `.env.example`. Tutte le chiavi sono opzionali: l'app parte anche senza, e la pagina **Diagnostica** ti dice cosa manca.

I modelli predefiniti sono allineati ai cataloghi attuali — GPT-OSS 120B per Groq, Nemotron Ultra (free) per OpenRouter, Gemini 3.8 Flash per Google — e ogni provider ha una catena di sostituti: se un modello viene ritirato, l'app passa al successivo senza smettere di funzionare.

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
   - Inserisci `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (obbligatorie per login, catalogo e ordini).
   - `SUPABASE_SERVICE_ROLE_KEY` e opzionale: serve alle automazioni server-side senza sessione (monitor, autopilot). Con il login, import, ordini e diagnostica funzionano anche senza.
   - Crea almeno un utente in **Authentication > Users** (email + password) per accedere a `/login`.

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
| `/api/import` | POST | Importazione prodotti con ricarico automatico (sessione o service role) |
| `/api/orders` | GET / POST | Gestione ordini su database protetto da RLS |
| `/api/suppliers` | GET | Elenco fornitori verificati |
| `/api/fulfill` | POST | Preparazione evasione ordine verso CJ |
| `/api/monitor` | GET | Snapshot periodico prezzi e stock per cron jobs |
| `/api/generate-ad` | POST | Script storyboard, copy persuasivo e prompt creativo |
| `/api/generate-video` | POST | Fotogrammi verticali pubblicitari via Hugging Face |
| `/api/website` | POST | Generazione sito web e landing page completa |
| `/api/tiktok` | POST | Pubblicazione video su TikTok |
| `/api/youtube` | POST | Caricamento video Shorts su YouTube |
| `/api/products` | GET | Catalogo prodotti (richiede sessione) |
| `/api/ad-queue` | GET / POST | Coda di pubblicazione delle ads |
| `/api/auto-ads` | GET | Ads TikTok + YouTube generate per i prodotti con potenziale |
| `/api/storefront` | POST | Testi completi di una landing page di vendita |
| `/api/digital-product` | POST | Ebook/guida vendibile scritta dall'AI |
| `/api/calendar` | POST | Piano editoriale di 7 giorni |
| `/api/pod` | POST | Idee print-on-demand |
| `/api/ugc` | POST | Script, rate card ed email per proporsi ai brand |
| `/api/instagram` | POST | Pubblicazione Reels/post su Instagram |
| `/api/facebook` | POST | Post e video sulla Pagina Facebook |
| `/api/publish-all` | POST | Stesso video su tutte le piattaforme configurate |
| `/api/ai-status` | GET | Verifica dal vivo del provider AI attivo |
| `/api/health` | GET | Diagnostica in tempo reale di tutte le chiavi e servizi |
| `/api/health/fix` | POST | Verifica delle 6 tabelle dello schema (richiede sessione) |
| `/api/auth/logout` | POST | Chiude la sessione Supabase |

---

## 🔒 Sicurezza

- Con Supabase configurato il middleware protegge pagine e API: senza sessione le pagine rimandano a `/login` e le API rispondono `401` in JSON.
- Le tabelle usano la Row Level Security: leggono e scrivono solo gli utenti autenticati.
- `/api/monitor` è raggiungibile dal cron: accetta solo il `Authorization: Bearer <CRON_SECRET>` oppure una sessione valida. Imposta sempre un `CRON_SECRET` casuale in produzione.
- Le chiavi private restano server-side: nel browser finiscono solo le due variabili `NEXT_PUBLIC_*` di Supabase.
- `POST /api/health/fix` richiede una sessione utente autenticata e usa la service role se presente; altrimenti verifica le tabelle con il client autenticato (RLS).

---

## 💎 Crediti e Licenza

Software ideato, sviluppato e manutenuto da **Ahsen Kurtoski**.

Rilasciato con licenza **MIT** — vedi il file [LICENSE](./LICENSE).
