import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const FPS = 30
const SECONDS = Number(process.env.TEASER_SECONDS || 18)
const OUT = path.resolve(process.env.OUT_DIR || 'assets/launch/video/vertical-frames')
const TOTAL = Math.round(SECONDS * FPS)

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
  defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(30000)
await page.goto('http://127.0.0.1:4173/vertical.html?render=1', { waitUntil: 'networkidle2' })
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => {
  document.body.classList.add('render-mode')
  const progress = document.querySelector('.progress i')
  if (progress) progress.style.animation = 'none'
})
await new Promise((resolve) => setTimeout(resolve, 500))

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
console.log(JSON.stringify({ frames: TOTAL, fps: FPS, seconds: SECONDS, elapsed: (Date.now() - started) / 1000, out: OUT }))
