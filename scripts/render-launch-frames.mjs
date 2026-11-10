import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const FPS = Number(process.env.FPS || 30)
const DURATION = Number(process.env.DURATION || 44)
const TEST_SECONDS = Number(process.env.TEST_SECONDS || 0)
const OUT = path.resolve(process.env.OUT_DIR || 'assets/launch/video/frames-final')
const TOTAL = Math.round((TEST_SECONDS || DURATION) * FPS)

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: [
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(30000)
await page.goto('http://127.0.0.1:4173/launch.html?render=1', { waitUntil: 'networkidle2' })
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => {
  document.body.classList.add('render-mode')
  const standby = document.getElementById('standby')
  if (standby) standby.style.display = 'none'
})
await new Promise((r) => setTimeout(r, 500))

const started = Date.now()
for (let i = 0; i < TOTAL; i++) {
  const t = i / FPS
  await page.evaluate((seconds) => window.renderAt(seconds), t)
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.screenshot({
    path: path.join(OUT, `frame-${String(i).padStart(5, '0')}.jpg`),
    type: 'jpeg',
    quality: 90,
  })
  if (i % 60 === 0 || i === TOTAL - 1) {
    console.log(`frame ${i + 1}/${TOTAL} t=${t.toFixed(2)}s elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`)
  }
}

await browser.close()
console.log(JSON.stringify({ frames: TOTAL, fps: FPS, seconds: TOTAL / FPS, elapsed: (Date.now() - started) / 1000, out: OUT }))
