import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = process.env.APP_URL || 'http://127.0.0.1:5180/'

mkdirSync('shots', { recursive: true })

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
await page.screenshot({ path: 'shots/desktop.png' })

console.log('console errors:', errors.length ? errors : 'none')
await browser.close()
