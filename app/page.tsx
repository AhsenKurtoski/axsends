import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  DollarSign,
  Globe,
  KeyRound,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Megaphone,
  Package,
  Radar,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  Wallet,
  Wand2,
  Zap,
} from 'lucide-react'

type Feature = { icon: typeof Radar; title: string; desc: string }
type Group = { title: string; intro: string; items: Feature[] }

const GROUPS: Group[] = [
  {
    title: 'Scoperta prodotti',
    intro: 'Dati reali da CJ Dropshipping, con un punteggio che spiega perché un prodotto può funzionare.',
    items: [
      { icon: Radar, title: 'Radar vincenti', desc: 'Scansione multi-nicchia con punteggio 0-100, margine e profitto stimato per vendita.' },
      { icon: Sparkles, title: 'Ricerca con scoring', desc: 'Parola chiave libera, ordinamento per potenziale, domanda o margine.' },
      { icon: LineChart, title: 'Trend virali', desc: 'Classifica per segnali di domanda, per capire cosa sta salendo adesso.' },
      { icon: Package, title: 'Import nel catalogo', desc: 'Import con ricarico automatico e prezzi psicologici, senza duplicati.' },
      { icon: Wand2, title: 'Autopilot', desc: 'Un clic: trova i prodotti, salva i migliori, scrive l’ad e costruisce la landing.' },
    ],
  },
  {
    title: 'Contenuti con AI',
    intro: 'Testi scritti da un modello vero. Se non c’è una chiave, il software te lo dice invece di inventare.',
    items: [
      { icon: BookOpen, title: 'Schede prodotto', desc: 'Titolo SEO, descrizione, benefici e tag generati sul tuo prodotto.' },
      { icon: Megaphone, title: 'Ads TikTok e YouTube', desc: 'Hook, caption, hashtag, script scena per scena e targeting.' },
      { icon: Clapperboard, title: 'Storyboard e fotogrammi', desc: 'Script da 20 secondi e frame verticali pronti da montare.' },
      { icon: CalendarDays, title: 'Calendario editoriale', desc: 'Piano di 7 giorni con idee, format e hashtag per la tua nicchia.' },
      { icon: Store, title: 'Landing e storefront', desc: 'Testi di vendita completi: headline, benefici, FAQ, garanzia e CTA.' },
      { icon: BookOpen, title: 'Ebook e prodotti digitali', desc: 'Guida scritta capitolo per capitolo, scaricabile in HTML/PDF.' },
      { icon: Globe, title: 'Web Studio', desc: 'Siti premium multi-sezione in un singolo file HTML, pronti da consegnare.' },
      { icon: Zap, title: 'UGC e print on demand', desc: 'Script e rate card per i brand, più slogan e concept per magliette e poster.' },
    ],
  },
  {
    title: 'Pubblicazione',
    intro: 'Le API ufficiali delle piattaforme, con la coda di lavoro per non perdere nessun contenuto.',
    items: [
      { icon: Megaphone, title: 'TikTok', desc: 'Direct post dei video; privato finché l’app non è approvata da TikTok.' },
      { icon: Sparkles, title: 'YouTube Shorts', desc: 'Upload resumable con titolo, descrizione e tag.' },
      { icon: Store, title: 'Instagram Reels', desc: 'Container e pubblicazione tramite Graph API, con attesa dell’elaborazione.' },
      { icon: Globe, title: 'Facebook Pages', desc: 'Post, foto e video sulla tua Pagina.' },
      { icon: ListChecks, title: 'Pubblica ovunque', desc: 'Un solo URL video su tutte le piattaforme configurate, con esito per ognuna.' },
      { icon: CalendarDays, title: 'Coda di pubblicazione', desc: 'Ads salvate, URL video e stato, pronte da riprendere quando vuoi.' },
    ],
  },
  {
    title: 'Monetizzazione',
    intro: 'Oltre al dropshipping: strumenti concreti per diversificare le entrate.',
    items: [
      { icon: DollarSign, title: 'Link affiliati', desc: 'Costruzione del link Amazon con il tuo tag e disclosure legale inclusa.' },
      { icon: Wallet, title: '17 metodi di guadagno', desc: 'Una panoramica onesta delle leve disponibili, con cosa serve per ognuna.' },
      { icon: Store, title: 'Landing che vende', desc: 'Copy testato per la conversione, da usare con il tuo store o i tuoi link.' },
      { icon: Globe, title: 'Siti per clienti', desc: 'Genera un sito e vendilo a un’attività locale: il codice è tuo.' },
      { icon: BookOpen, title: 'Prodotti digitali', desc: 'Ebook e guide con margine quasi pieno, senza magazzino.' },
      { icon: Clapperboard, title: 'UGC per brand', desc: 'Script, listino e email di proposta per iniziare come creator.' },
    ],
  },
  {
    title: 'Operazioni',
    intro: 'Catalogo, ordini e controllo: la parte noiosa che deve funzionare da sola.',
    items: [
      { icon: ShoppingCart, title: 'Ordini', desc: 'Registrazione e stato degli ordini su database protetto da RLS.' },
      { icon: Truck, title: 'Fornitori', desc: 'Anagrafica fornitori con paese, rating e tempi di spedizione.' },
      { icon: Tag, title: 'Regole di prezzo', desc: 'Markup, margine minimo e arrotondamento .99 con anteprima in tempo reale.' },
      { icon: BarChart3, title: 'Analytics', desc: 'Ricavi, margine medio, prodotti e andamento per data.' },
      { icon: Zap, title: 'Monitoraggio 6 ore', desc: 'Cron che registra prezzi e stock e segnala quando un prodotto sta finendo.' },
      { icon: ShieldCheck, title: 'Diagnostica', desc: 'Stato reale di ogni chiave, con verifica delle tabelle e istruzioni di riparazione.' },
    ],
  },
]

const STEPS = [
  { title: '1. Chiavi', desc: 'Copia .env.example in .env.local e compila solo i servizi che vuoi usare. Nessuna chiave è obbligatoria.' },
  { title: '2. Database', desc: 'Esegui supabase-schema.sql nel SQL Editor di Supabase: è idempotente, puoi rilanciarlo.' },
  { title: '3. Utente', desc: 'Crea il tuo utente in Supabase Auth: da lì in poi l’accesso è protetto da sessione.' },
  { title: '4. Lavora', desc: 'Apri la dashboard, lancia il Radar o l’Autopilot e salva le ads in coda.' },
]

const FAQ = [
  {
    q: 'È davvero gratis?',
    a: 'Sì. Il software è open source con licenza MIT: nessun abbonamento, nessun paywall, nessuna funzione bloccata. Paghi solo, se vuoi, i servizi che colleghi, e ognuno ha un piano gratuito.',
  },
  {
    q: 'Devo configurare tutto per usarlo?',
    a: 'No. Ogni modulo dichiara cosa gli serve. Senza chiavi l’app parte con le sezioni vuote, senza dati inventati, e la Diagnostica ti dice esattamente quale variabile manca.',
  },
  {
    q: 'I miei dati dove finiscono?',
    a: 'Nel tuo progetto Supabase, con Row Level Security attiva. Le chiavi restano server-side: nel browser arrivano solo le due variabili pubbliche di Supabase.',
  },
  {
    q: 'Genera contenuti inventati se l’AI non risponde?',
    a: 'No. Se manca una chiave o il modello non risponde, ricevi un errore chiaro (503/502) con il nome della variabile da impostare. Nessun testo di riempimento spacciato per generato.',
  },
  {
    q: 'Posso pubblicare davvero sui social?',
    a: 'Sì, tramite le API ufficiali, con i limiti delle piattaforme: TikTok richiede un’app approvata, YouTube un token OAuth valido e Instagram un account Business collegato a una Pagina.',
  },
  {
    q: 'Ci sono garanzie di guadagno?',
    a: 'Nessuna. Il software automatizza ricerca, contenuti e pubblicazione; i risultati dipendono dal prodotto, dal traffico e dal lavoro. I guadagni non sono garantiti.',
  },
]

const STATS = [
  { value: '24', label: 'moduli nella dashboard' },
  { value: '4', label: 'piattaforme social' },
  { value: '3', label: 'provider AI' },
  { value: 'MIT', label: 'licenza, uso libero' },
]

export default function HomePage() {
  return (
    <div className='mx-auto max-w-5xl space-y-10 py-4'>
      <section className='glass overflow-hidden p-7 sm:p-10'>
        <span className='inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300'>
          <ShieldCheck size={13} /> Gratuito e open source · licenza MIT
        </span>
        <h1 className='mt-5 text-3xl font-semibold leading-tight sm:text-5xl'>
          Il sistema operativo del
          <span className='block text-brand'>dropshipping con AI vera</span>
        </h1>
        <p className='mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base'>
          AhsenDS trova prodotti su CJ Dropshipping, li valuta, scrive copy e video ads, genera landing
          page complete, le pubblica sui social e tiene ordini e margini sotto controllo. Self-hosted,
          con le tue chiavi, senza abbonamenti.
        </p>
        <div className='mt-7 flex flex-col gap-3 sm:flex-row'>
          <Link
            href='/app'
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-dark'
          >
            Apri la dashboard <ArrowRight size={16} />
          </Link>
          <Link
            href='/login'
            className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5'
          >
            Accedi
          </Link>
          <Link
            href='/launch'
            className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5'
          >
            Launch kit <Sparkles size={16} />
          </Link>
        </div>
        <p className='mt-3 text-xs text-white/35'>
          Con Supabase configurato l’accesso è obbligatorio. Senza chiavi si apre senza database, senza
          contenuti finti.
        </p>

        <div className='mt-8 grid grid-cols-2 gap-3 border-t border-white/5 pt-6 sm:grid-cols-4'>
          {STATS.map((s) => (
            <div key={s.label}>
              <div className='text-2xl font-semibold text-white'>{s.value}</div>
              <div className='text-[11px] text-white/40'>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className='space-y-6'>
        <div>
          <h2 className='text-xl font-semibold'>Tutto quello che fa</h2>
          <p className='text-sm text-white/50'>
            Ogni voce corrisponde a una sezione della dashboard: stessa logica, stessi nomi, nessuna
            promessa che il software non mantenga.
          </p>
        </div>

        {GROUPS.map((g) => (
          <div key={g.title} className='glass p-5 sm:p-6'>
            <div className='flex flex-col gap-1 border-b border-white/5 pb-4 sm:flex-row sm:items-baseline sm:justify-between'>
              <h3 className='text-sm font-semibold text-brand'>{g.title}</h3>
              <p className='max-w-xl text-xs text-white/40'>{g.intro}</p>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {g.items.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className='flex gap-3'>
                    <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand'>
                      <Icon size={17} />
                    </span>
                    <div>
                      <div className='text-sm font-medium'>{item.title}</div>
                      <p className='mt-0.5 text-xs leading-relaxed text-white/50'>{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className='glass p-7'>
        <h2 className='text-lg font-medium'>Dalla cartella vuota al primo prodotto</h2>
        <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {STEPS.map((s) => (
            <div key={s.title} className='rounded-xl border border-white/5 bg-white/5 p-4'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <CheckCircle2 size={15} className='text-brand' /> {s.title}
              </div>
              <p className='mt-1 text-xs leading-relaxed text-white/50'>{s.desc}</p>
            </div>
          ))}
        </div>
        <div className='mt-4 flex flex-wrap gap-2 text-[11px] text-white/40'>
          <code className='rounded-md bg-white/5 px-1.5 py-0.5'>npm install</code>
          <code className='rounded-md bg-white/5 px-1.5 py-0.5'>cp .env.example .env.local</code>
          <code className='rounded-md bg-white/5 px-1.5 py-0.5'>npm run dev</code>
          <code className='rounded-md bg-white/5 px-1.5 py-0.5'>npm run build</code>
        </div>
      </section>

      <section className='glass p-7'>
        <div className='flex items-start gap-3'>
          <span className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand'>
            <KeyRound size={19} />
          </span>
          <div>
            <h2 className='text-lg font-medium'>Diagnostica, non indovinelli</h2>
            <p className='mt-1 max-w-2xl text-sm leading-relaxed text-white/60'>
              La pagina Diagnostica contatta davvero ogni servizio: AI, database, CJ, Hugging Face e i
              social. Per ognuno vedi stato, messaggio di errore reale e il nome esatto della variabile
              da impostare. C’è anche il controllo delle sei tabelle dello schema, con l’istruzione di
              riparazione.
            </p>
            <Link
              href='/app/settings'
              className='mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5'
            >
              <LayoutDashboard size={14} /> Apri la Diagnostica
            </Link>
          </div>
        </div>
      </section>

      <section className='glass border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-7'>
        <h2 className='text-lg font-medium'>Perché è gratis (davvero)</h2>
        <p className='mt-2 max-w-2xl text-sm leading-relaxed text-white/60'>
          Il codice è tuo, sotto licenza MIT: puoi usarlo, modificarlo e ridistribuirlo. Non c’è un piano
          a pagamento nascosto e nessuna funzione bloccata. I servizi esterni sono opzionali e ognuno ha
          un livello gratuito:
        </p>
        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/60'>
            <div className='text-sm font-medium text-white'>AI (testi)</div>
            Groq, OpenRouter e Gemini hanno piani gratuiti. Basta una chiave: la catena prova i provider
            in ordine e usa quello disponibile.
          </div>
          <div className='rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/60'>
            <div className='text-sm font-medium text-white'>Database e login</div>
            Il piano gratuito di Supabase copre questo uso: tabelle, RLS e autenticazione.
          </div>
          <div className='rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/60'>
            <div className='text-sm font-medium text-white'>Prodotti</div>
            L’account CJ Dropshipping è gratuito; l’API richiede email e API Key dal pannello.
          </div>
          <div className='rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/60'>
            <div className='text-sm font-medium text-white'>Immagini</div>
            Hugging Face offre un livello gratuito con limiti; il software usa il token solo se lo
            fornisci.
          </div>
        </div>
        <p className='mt-3 text-xs text-white/40'>
          Nota onesta: i piani gratuiti hanno limiti di velocità e quota. Se li superi, il servizio può
          rispondere con un errore temporaneo (lo vedi in Diagnostica) o chiedere un piano a pagamento.
          Nessun guadagno è garantito: il software automatizza il lavoro, non i risultati.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Domande frequenti</h2>
        {FAQ.map((f) => (
          <details key={f.q} className='glass p-4'>
            <summary className='cursor-pointer text-sm font-medium'>{f.q}</summary>
            <p className='mt-2 text-sm leading-relaxed text-white/60'>{f.a}</p>
          </details>
        ))}
      </section>

      <section className='glass p-7 text-center'>
        <h2 className='text-xl font-semibold'>Pronto a partire?</h2>
        <p className='mx-auto mt-2 max-w-xl text-sm text-white/50'>
          Serve solo Node.js 18.17 o superiore. Il resto lo scegli tu: si parte anche senza chiavi, e la
          Diagnostica ti dice cosa aggiungere.
        </p>
        <div className='mt-5 flex flex-col justify-center gap-3 sm:flex-row'>
          <Link
            href='/app'
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-dark'
          >
            Apri la dashboard <ArrowRight size={16} />
          </Link>
          <Link
            href='/login'
            className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5'
          >
            Accedi
          </Link>
        </div>
      </section>
    </div>
  )
}
