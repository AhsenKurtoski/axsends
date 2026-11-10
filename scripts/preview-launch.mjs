import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = path.resolve('public/launch/preview')
await fs.mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(30000)
await page.goto('http://127.0.0.1:4173/launch.html', { waitUntil: 'networkidle2' })
await page.evaluate(() => document.fonts.ready)
await new Promise((r) => setTimeout(r, 1000))

for (let i = 0; i < 8; i++) {
  await page.evaluate((index) => {
    document.body.classList.add('playing')
    const standby = document.getElementById('standby')
    if (standby) standby.classList.add('hide')
    document.querySelectorAll('.scene').forEach((scene, j) => scene.classList.toggle('active', j === index))
  }, i)
  await new Promise((r) => setTimeout(r, 1100))
  const file = path.join(OUT, `scene-${String(i + 1).padStart(2, '0')}.png`)
  await page.screenshot({ path: file, type: 'png' })
  const info = await page.evaluate(() => {
    const active = document.querySelector('.scene.active')
    const stage = document.getElementById('stage')
    const rect = active ? active.getBoundingClientRect() : null
    const over = active ? Array.from(active.querySelectorAll('*')).filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && (r.right > 1930 || r.bottom > 1090 || r.left < -10 || r.top < -10)
    }).slice(0, 6).map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 60), r: (() => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })() })) : []
    return { scroll: [stage.scrollWidth, stage.scrollHeight], rect: rect ? [Math.round(rect.width), Math.round(rect.height)] : null, over }
  })
  console.log(`scene-${i + 1}`, JSON.stringify(info))
  await page.evaluate(() => document.body.classList.remove('playing'))
}

await browser.close()
console.log('DONE')
