import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.AHSENDS_BASE || 'http://127.0.0.1:3111'
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Imposta E2E_EMAIL e E2E_PASSWORD. Nessuna credenziale è hardcoded nello script.')
  process.exit(1)
}

const PREVIEW = path.resolve('/tmp/ahsends-preview')
await fs.mkdir(PREVIEW, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(45000)
page.setDefaultNavigationTimeout(45000)

await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
await page.type('#login-email', EMAIL)
await page.type('#login-password', PASSWORD)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('button[type="submit"]'),
])
await page.waitForFunction(() => location.pathname.startsWith('/app'), { timeout: 30000 })

const result = await page.evaluate(async () => {
  const call = async (url, init) => {
    const response = await fetch(url, init)
    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }
    return { status: response.status, body }
  }

  const headers = { 'Content-Type': 'application/json' }
  const importResult = await call('/api/import', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [
        {
          externalId: 'E2E-PROD-2026',
          name: 'Auricolari Nova Pro',
          cost: 12.5,
          image: '/launch/products/headphones.jpg',
          supplier: 'E2E Test Supplier',
          stock: 50,
        },
      ],
    }),
  })

  const existingOrders = await call('/api/orders')
  const existingIds = new Set((existingOrders.body?.data || []).map((order) => order.id))
  const orderId = existingIds.has('E2E-ORD-2026') ? 'E2E-ORD-2026-02' : 'E2E-ORD-2026'
  const orderResult = existingIds.has('E2E-ORD-2026')
    ? { status: 200, body: { ok: true, skipped: true, id: 'E2E-ORD-2026' } }
    : await call('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: orderId,
          product: 'Auricolari Nova Pro',
          customer: 'Cliente E2E',
          total: 29.9,
          status: 'delivered',
          date: '2026-11-10',
          }),
      })

  const products = await call('/api/products')
  const orders = await call('/api/orders')
  const healthFix = await call('/api/health/fix', { method: 'POST' })
  const health = await call('/api/health')

  return { importResult, orderResult, orderId, products, orders, healthFix, health }
})

await page.goto(BASE + '/app', { waitUntil: 'networkidle2' })
await page.waitForFunction(
  () => (document.body.innerText || '').includes('Auricolari Nova Pro'),
  { timeout: 30000 }
)
await page.screenshot({ path: path.join(PREVIEW, 'e2e-dashboard.png'), type: 'png' })

await page.goto(BASE + '/app/orders', { waitUntil: 'networkidle2' })
await page.waitForFunction(
  () => (document.body.innerText || '').includes('E2E-ORD-2026'),
  { timeout: 30000 }
)
await page.screenshot({ path: path.join(PREVIEW, 'e2e-orders.png'), type: 'png' })

const summary = {
  loginPath: await page.evaluate(() => location.pathname),
  importStatus: result.importResult.status,
  imported: result.importResult.body?.imported,
  product: result.importResult.body?.data?.[0]?.name || null,
  orderStatus: result.orderResult.status,
  orderId: result.orderId,
  productsCount: Array.isArray(result.products.body?.data) ? result.products.body.data.length : null,
  ordersCount: Array.isArray(result.orders.body?.data) ? result.orders.body.data.length : null,
  healthFix: result.healthFix.body,
  healthConfigured: result.health.body?.supabase?.configured ?? result.health.body?.configured ?? null,
}

console.log(JSON.stringify(summary, null, 2))
await browser.close()

if (result.importResult.status >= 300 || result.orderResult.status >= 300 || !result.healthFix.body?.ok) {
  process.exit(1)
}
