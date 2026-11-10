import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = path.resolve('/tmp/ahsends-preview')
await fs.mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none'],
  defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
await page.goto('http://127.0.0.1:4173/vertical.html?render=1', { waitUntil: 'networkidle2' })
await page.evaluate(() => document.fonts.ready)
await page.evaluate(() => document.body.classList.add('render-mode'))
await new Promise((resolve) => setTimeout(resolve, 400))

const times = [1.4, 5.2, 8.4, 12.0, 16.2]
for (let i = 0; i < times.length; i++) {
  await page.evaluate((seconds) => window.renderAt(seconds), times[i])
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.screenshot({ path: path.join(OUT, `vertical-${i + 1}.png`), type: 'png' })
  console.log(`vertical-${i + 1} @ ${times[i]}s`)
}

await browser.close()
