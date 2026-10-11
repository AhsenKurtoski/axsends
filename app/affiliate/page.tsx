'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Trash2, Sparkles, Loader2, Link2, Copy, Check } from 'lucide-react'

type AffLink = { id: string; product: string; network: string; url: string; clicks: number; earnings: number }

const NETWORKS = ['Amazon', 'CJ Affiliate', 'Awin', 'AliExpress', 'Impact', 'Altro']

const METHODS = [
  { n: 1, title: 'Affiliate Amazon (Associates)', desc: 'Commissioni 1-10% su tutto cio che le persone comprano dai tuoi link Amazon entro 24h.' },
  { n: 2, title: 'Affiliate AliExpress', desc: 'Programma AliExpress Affiliate: guadagni su ogni ordine generato dai tuoi link.' },
  { n: 3, title: 'Network affiliate (Awin, Impact, CJ)', desc: 'Migliaia di brand con commissioni spesso piu alte di Amazon.' },
  { n: 4, title: 'TikTok Creator Rewards', desc: 'Guadagni dalle views dei video oltre 1 minuto, quando raggiungi i requisiti.' },
  { n: 5, title: 'TikTok Shop Affiliate', desc: 'Promuovi prodotti del marketplace e prendi una commissione per ogni vendita.' },
  { n: 6, title: 'YouTube Partner Program', desc: 'Monetizza Shorts e video con la pubblicita quando raggiungi i requisiti.' },
  { n: 7, title: 'Brand deal e sponsorizzazioni', desc: 'I brand ti pagano per parlare dei loro prodotti man mano che cresci.' },
  { n: 8, title: 'UGC Creator', desc: 'Vendi video user-generated ai brand: 50-150 EUR a video, anche senza followers.' },
  { n: 9, title: 'Print on Demand', desc: 'Magliette, poster, tazze stampati su richiesta (es. Printful): nessun magazzino.' },
  { n: 10, title: 'Prodotti digitali', desc: 'Ebook, preset, template: li crei una volta e li vendi infinite volte.' },
  { n: 11, title: 'Rivendita su marketplace locali', desc: 'Rivendi prodotti CJ su Vinted, Subito, eBay, Wallapop.' },
  { n: 12, title: 'Bundle e kit', desc: 'Vendi piu prodotti insieme per alzare lo scontrino medio.' },
  { n: 13, title: 'Upsell e cross-sell', desc: 'Proponi prodotti correlati a chi sta gia comprando.' },
  { n: 14, title: 'Email e DM marketing', desc: 'Riconverti chi ti segue o ha gia comprato con messaggi mirati.' },
  { n: 15, title: 'Cashback e referral', desc: 'Invita amici su app e servizi e incassa i bonus referral.' },
  { n: 16, title: 'Lead generation', desc: 'Raccogli contatti interessati e monetizzali con offerte mirate.' },
  { n: 17, title: 'Servizio social per altri', desc: 'Offri il tuo sistema AI come servizio a piccoli negozi, a pagamento mensile.' },
]

function buildAmazonLink(rawUrl: string, tag: string): string {
  let url = (rawUrl || '').trim()
  if (!url) return ''
  if (url.indexOf('http') !== 0) url = 'https://' + url
  try {
    const u = new URL(url)
    if (tag) u.searchParams.set('tag', tag)
    return u.toString()
  } catch (err) {
    const sep = url.indexOf('?') >= 0 ? '&' : '?'
    return tag ? url + sep + 'tag=' + encodeURIComponent(tag) : url
  }
}

export default function AffiliatePage() {
  const [links, setLinks] = useState<AffLink[]>([])
  const [product, setProduct] = useState('')
  const [network, setNetwork] = useState('Amazon')
  const [url, setUrl] = useState('')
  const [gen, setGen] = useState<any>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genFor, setGenFor] = useState<string | null>(null)

  const [amazonTag, setAmazonTag] = useState('')
  const [rawAmazon, setRawAmazon] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ahsends_affiliate') || localStorage.getItem('axsends_affiliate')
      if (raw) setLinks(JSON.parse(raw))
      const tag = localStorage.getItem('ahsends_amazon_tag') || localStorage.getItem('axsends_amazon_tag')
      if (tag) setAmazonTag(tag)
    } catch (err) {
      // nessun dato salvato
    }
  }, [])

  function persist(next: AffLink[]) {
    setLinks(next)
    try {
      localStorage.setItem('ahsends_affiliate', JSON.stringify(next))
    } catch (err) {
      // localStorage non disponibile
    }
  }

  function saveTag(v: string) {
    setAmazonTag(v)
    try {
      localStorage.setItem('ahsends_amazon_tag', v)
    } catch (err) {
      // localStorage non disponibile
    }
  }

  const amazonLink = buildAmazonLink(rawAmazon, amazonTag)

  function copyAmazon() {
    if (!amazonLink) return
    try {
      navigator.clipboard.writeText(amazonLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      // clipboard non disponibile
    }
  }

  function addAmazonToLinks() {
    if (!amazonLink) return
    const item: AffLink = { id: String(Date.now()), product: product || 'Prodotto Amazon', network: 'Amazon', url: amazonLink, clicks: 0, earnings: 0 }
    persist([item].concat(links))
  }

  function add(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !url) return
    const item: AffLink = { id: String(Date.now()), product, network, url, clicks: 0, earnings: 0 }
    persist([item].concat(links))
    setProduct('')
    setUrl('')
  }

  function remove(id: string) {
    persist(links.filter((l) => l.id !== id))
  }

  async function generate(l: AffLink) {
    setGenLoading(true)
    setGenFor(l.id)
    setGen(null)
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: l.product, link: l.url, network: l.network }),
      })
      setGen(await res.json())
    } catch (err) {
      // errore generazione
    } finally {
      setGenLoading(false)
    }
  }

  const totalEarnings = links.reduce((s, l) => s + (l.earnings || 0), 0)
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0)

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <DollarSign className='text-brand' size={22} /> Affiliate &amp; Guadagni AhsenDS
          </h1>
          <p className='text-sm text-white/50'>Genera link affiliati automaticamente e monetizza &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      <div className='glass space-y-4 p-5'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Link2 size={16} className='text-brand' /> Generatore link Amazon (Associates)
        </div>
        <p className='text-xs text-white/50'>
          1) Iscriviti gratis ad Amazon Associates su affiliate-program.amazon.it e prendi il tuo Tag ID (es. tuonome-21). 2) Incolla qui sotto il tuo tag e il link di un prodotto Amazon: ti creo il link affiliato pronto da condividere.
        </p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Il tuo Amazon Tag ID</label>
            <input value={amazonTag} onChange={(e) => saveTag(e.target.value)} placeholder='es. tuonome-21' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Link prodotto Amazon</label>
            <input value={rawAmazon} onChange={(e) => setRawAmazon(e.target.value)} placeholder='https://www.amazon.it/dp/...' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
        </div>
        {amazonLink ? (
          <div className='rounded-xl border border-brand/30 bg-brand/10 p-3'>
            <div className='text-xs text-white/50'>Il tuo link affiliato</div>
            <div className='mt-1 break-all text-sm text-brand'>{amazonLink}</div>
            <div className='mt-3 flex gap-2'>
              <button onClick={copyAmazon} className='flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs text-white transition hover:bg-brand-dark'>
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiato' : 'Copia link'}
              </button>
              <button onClick={addAmazonToLinks} className='flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                <Plus size={13} /> Salva nella lista
              </button>
            </div>
          </div>
        ) : (
          <p className='text-xs text-white/30'>Inserisci tag e link per generare il tuo link affiliato.</p>
        )}
        {!amazonTag ? <p className='text-xs text-amber-400'>Senza il tuo Tag ID il link non genera commissioni: registrati prima ad Amazon Associates.</p> : null}
      </div>

      <div className='glass p-5'>
        <div className='mb-1 text-sm font-medium'>17 metodi per fare soldi (oltre al dropshipping)</div>
        <p className='mb-4 text-xs text-white/50'>Ogni metodo e una vera leva di guadagno. Inizia da 1-2 e poi aggiungi gli altri.</p>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {METHODS.map((m) => (
            <div key={m.n} className='rounded-xl border border-white/5 bg-white/5 p-3'>
              <div className='flex items-center gap-2'>
                <span className='grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand/20 text-xs font-semibold text-brand'>{m.n}</span>
                <span className='text-sm font-medium'>{m.title}</span>
              </div>
              <p className='mt-2 text-xs text-white/50'>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Link attivi</div>
          <div className='mt-1 text-2xl font-semibold'>{links.length}</div>
        </div>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Click totali</div>
          <div className='mt-1 text-2xl font-semibold'>{totalClicks}</div>
        </div>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Guadagni stimati</div>
          <div className='mt-1 text-2xl font-semibold text-emerald-400'>{totalEarnings.toFixed(2)} EUR</div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={add} className='glass h-fit space-y-4 p-5'>
          <div className='text-sm font-medium'>Nuovo link affiliato</div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Prodotto</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder='Es. Cuffie wireless' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Network</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {NETWORKS.map((n) => (
                <option key={n} value={n} className='bg-[#12121f]'>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Link affiliato</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder='https://...' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <button type='submit' className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'>
            <Plus size={16} /> Aggiungi
          </button>
        </form>

        <div className='space-y-4 lg:col-span-2'>
          {links.length === 0 ? (
            <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
              <div>
                <DollarSign className='mx-auto mb-3 text-white/20' size={40} />
                Aggiungi il tuo primo link affiliato per iniziare.
              </div>
            </div>
          ) : (
            links.map((l) => (
              <div key={l.id} className='glass p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='font-medium'>{l.product}</div>
                    <div className='text-xs text-white/40'>{l.network}</div>
                    <a href={l.url} target='_blank' rel='noreferrer' className='mt-1 block max-w-xs truncate text-xs text-brand'>{l.url}</a>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <button onClick={() => generate(l)} className='flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'>
                      <Sparkles size={13} /> Contenuto
                    </button>
                    <button onClick={() => remove(l.id)} className='rounded-lg border border-white/10 p-1.5 text-white/50 transition hover:text-rose-400'>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {genFor === l.id ? (
                  <div className='mt-4 border-t border-white/5 pt-4'>
                    {genLoading ? (
                      <div className='flex items-center gap-2 text-sm text-white/50'>
                        <Loader2 size={14} className='animate-spin' /> Genero i contenuti...
                      </div>
                    ) : gen ? (
                      <div className='space-y-3 text-sm'>
                        <div>
                          <div className='text-xs uppercase tracking-wide text-brand'>Caption</div>
                          {(gen.captions || []).map((c: string, i: number) => (
                            <p key={i} className='mt-1 text-white/80'>{c}</p>
                          ))}
                        </div>
                        <p className='text-brand'>{(gen.hashtags || []).join(' ')}</p>
                        <div className='rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60'>{gen.disclosure}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <p className='text-xs text-white/30'>Nota onesta: i guadagni non sono garantiti e dipendono da traffico e conversioni. Questi strumenti aumentano le tue possibilita, non promettono soldi sicuri.</p>
    </div>
  )
}
