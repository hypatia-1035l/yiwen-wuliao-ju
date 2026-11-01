/**
 * 验证「双击即开」单文件版：用真实浏览器以 file:// 协议打开，
 * 检查渲染、建模板、IndexedDB 存写、刷新恢复。
 */
import { chromium } from 'playwright-core'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync } from 'node:fs'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(root, '..')
const file = join(projectRoot, '异闻物料局.html')
const shots = join(projectRoot, 'shots')
if (!existsSync(shots)) mkdirSync(shots, { recursive: true })

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let pass = 0
let fail = 0
const ok = (cond, msg, extra = '') => {
  if (cond) {
    pass++
    console.log(`  PASS  ${msg}`)
  } else {
    fail++
    console.log(`  FAIL  ${msg}${extra ? ' :: ' + extra : ''}`)
  }
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

const url = pathToFileURL(file).href
console.log('打开：', decodeURIComponent(url))
await page.goto(url, { waitUntil: 'load' })
await sleep(2200)

console.log('\n[A] 渲染')
const tplCount = await page.locator('.tpl').count()
ok(tplCount >= 4, `模板区渲染（${tplCount} 个模板卡）`)
const appBg = await page.evaluate(() => {
  const el = document.querySelector('#app')
  return el ? el.getBoundingClientRect().height : 0
})
ok(appBg > 300, `根节点有实际高度（${appBg}px）`)
await page.screenshot({ path: join(shots, 'standalone-open.png') })

console.log('\n[B] 建模板')
await page.locator('.tpl').first().click()
await sleep(1200)
const canvas = await page.locator('canvas').count()
ok(canvas > 0, `Konva 画布已创建（${canvas} 个 canvas 元素）`)
const painted = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return false
  const ctx = c.getContext('2d')
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  let nonBg = 0
  for (let i = 0; i < d.length; i += 4000) {
    if (d[i] > 40 || d[i + 1] > 40 || d[i + 2] > 40) nonBg++
  }
  return nonBg > 20
})
ok(painted, '画布上确有内容（非纯黑）')
await page.screenshot({ path: join(shots, 'standalone-template.png') })

console.log('\n[C] 图层')
await page.locator('.tab', { hasText: '图层' }).first().click().catch(() => {})
await sleep(500)
const layers = await page.locator('.layer').count()
ok(layers > 5, `图层列表可用（${layers} 层）`)

console.log('\n[D] IndexedDB（file:// 下是否可用）')
const idb = await page.evaluate(async () => {
  try {
    if (typeof indexedDB === 'undefined') return { ok: false, err: 'indexedDB undefined' }
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('probe-db', 1)
      r.onupgradeneeded = () => r.result.createObjectStore('t', { keyPath: 'k' })
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
      r.onblocked = () => rej(new Error('blocked'))
      setTimeout(() => rej(new Error('timeout')), 4000)
    })
    await new Promise((res, rej) => {
      const t = db.transaction('t', 'readwrite')
      t.objectStore('t').put({ k: 'a', v: 42 })
      t.oncomplete = () => res()
      t.onerror = () => rej(t.error)
      t.onabort = () => rej(t.error || new Error('abort'))
    })
    const val = await new Promise((res, rej) => {
      const t = db.transaction('t', 'readonly')
      const q = t.objectStore('t').get('a')
      q.onsuccess = () => res(q.result?.v)
      q.onerror = () => rej(q.error)
    })
    return { ok: val === 42 }
  } catch (e) {
    return { ok: false, err: String(e && e.message) }
  }
})
ok(idb.ok, 'file:// 下 IndexedDB 可读写', idb.err || '')

console.log('\n[E] 自动保存 / 刷新恢复')
const beforeName = await page.evaluate(() => document.querySelector('.name-input')?.value || '')
await sleep(1800)
await page.reload({ waitUntil: 'load' })
await sleep(2500)
const afterName = await page.evaluate(() => document.querySelector('.name-input')?.value || '')
const afterLayers = await page.locator('.layer').count()
ok(!!afterName, `刷新后仍载入项目「${afterName}」`, `刷新前「${beforeName}」`)
ok(afterLayers > 5 || (await page.locator('canvas').count()) > 0, '刷新后画布仍在')
await page.screenshot({ path: join(shots, 'standalone-reload.png') })

console.log('\n[F] 控制台错误')
const realErrors = errors.filter((e) => !/favicon/i.test(e))
ok(realErrors.length === 0, '无 JS 运行时错误', realErrors.slice(0, 5).join(' | '))

console.log(`\n结果：${pass} 通过 / ${fail} 失败`)
await browser.close()
process.exit(fail === 0 ? 0 : 1)
