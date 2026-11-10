import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.AHSENDS_BASE || 'http://127.0.0.1:3111'
const OUT = path.resolve('public/launch/screens')
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Imposta E2E_EMAIL e E2E_PASSWORD per catturare gli screenshot autenticati.')
  process.exit(1)
}

await fs.mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(45000)
page.setDefaultNavigationTimeout(45000)

async function cleanOverlays() {
  await page.addStyleTag({
    content: `
      html { scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; }
      a[href*="freebuff"], [data-freebuff], [class*="freebuff"] { display: none !important; }
    `,
  })
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('body *'))
    for (const el of nodes) {
      const text = (el.textContent || '').trim()
      if (text !== 'Freebuff') continue
      if (el.children.length > 2) continue
      const rect = el.getBoundingClientRect()
      if (rect.width > 240 || rect.height > 90) continue
      const target = el.closest('a') || el
      target.style.display = 'none'
    }
  })
}

async function waitText(text, timeout = 30000) {
  await page.waitForFunction(
    (needle) => (document.body.innerText || '').toLowerCase().includes(needle.toLowerCase()),
    { timeout },
    text
  )
}

async function shot(name, url, waits = [], settle = 900) {
  await page.goto(BASE + url, { waitUntil: 'networkidle2' })
  await page.evaluate(() => window.scrollTo(0, 0))
  for (const wait of waits) {
    if (wait.startsWith('text:')) await waitText(wait.slice(5))
    else await page.waitForSelector(wait, { visible: true })
  }
  await new Promise((resolve) => setTimeout(resolve, settle))
  await page.evaluate(() => window.scrollTo(0, 0))
  await cleanOverlays()
  const file = path.join(OUT, name + '.png')
  await page.screenshot({ path: file, type: 'png' })
  const stat = await fs.stat(file)
  console.log(`${name}: ${stat.size} bytes @ ${page.viewport().width}x${page.viewport().height}`)
}

console.log('Login...')
await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
await page.type('#login-email', EMAIL)
await page.type('#login-password', PASSWORD)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('button[type="submit"]'),
])
await page.waitForFunction(() => location.pathname.startsWith('/app'), { timeout: 30000 })
console.log('Login OK:', await page.evaluate(() => location.pathname))

await shot('01-landing', '/', ['h1'], 1200)
await shot('02-dashboard', '/app', ['text:Auricolari Nova Pro'], 1500)
await shot('03-autopilot', '/app/autopilot', ['h1'], 1000)
await shot('04-products', '/app/products', ['text:Auricolari Nova Pro'], 1200)
await shot('05-orders', '/app/orders', ['text:DEMO-1042'], 1000)
await shot('06-analytics', '/app/analytics', ['h1'], 1800)
await shot('07-radar', '/app/radar', ['h1'], 1000)

// Landing feature section, useful for the press kit and poster.
await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
await waitText('Tutto quello che fa')
await page.evaluate(() => {
  const headings = Array.from(document.querySelectorAll('h2'))
  const target = headings.find((h) => (h.textContent || '').includes('Tutto quello che fa'))
  if (target) target.scrollIntoView({ block: 'start' })
  window.scrollBy(0, -80)
})
await new Promise((resolve) => setTimeout(resolve, 900))
await cleanOverlays()
await page.screenshot({ path: path.join(OUT, '08-landing-features.png'), type: 'png' })
console.log('08-landing-features: saved')

await browser.close()
console.log('DONE')
