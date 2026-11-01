/**
 * 端到端验收：真实浏览器（本机 Edge）驱动整个编辑器。
 * 覆盖：四种模板、文字/图片编辑、图层、撤销重做、JSON 往返、
 * 刷新恢复、PNG/PDF 导出尺寸、移动端视口。
 *
 * 用法：node scripts/e2e.mjs   （需先启动 dev server 或设置 APP_URL）
 */
import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = process.env.APP_URL || 'http://127.0.0.1:5180/'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

mkdirSync(join(root, 'shots'), { recursive: true })
mkdirSync(join(root, 'e2e-out'), { recursive: true })

let pass = 0
let fail = 0
const fails = []
function ok(cond, name, extra = '') {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    fails.push(name)
    console.log(`  FAIL  ${name} ${extra}`)
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function gotoTab(page, label) {
  await page.locator('.tabs .tab', { hasText: label }).first().click()
  await sleep(350)
}
async function layerCount(page) {
  await gotoTab(page, '图层')
  return page.locator('.layer').count()
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 960 },
  acceptDownloads: true,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text())
})

/* ---------------------------------- 1. 四种模板 ---------------------------------- */
console.log('\n[1] 模板创建')
const TEMPLATE_NAMES = ['委托书 / 信件', '调查档案', '通缉令 / 公告', '日记 / 线索']
const templateIds = ['commission', 'dossier', 'wanted', 'diary']
await page.goto(URL, { waitUntil: 'networkidle' })
await sleep(1200)

for (let i = 0; i < 4; i++) {
  await gotoTab(page, '模板')
  await page.locator('.tpl').nth(i).click()
  await sleep(900)
  const count = await layerCount(page)
  ok(count > 5, `模板「${TEMPLATE_NAMES[i]}」创建成功（图层 ${count} 个）`)
  await page.screenshot({ path: join(root, `shots/tpl-${templateIds[i]}.png`) })
}

/* ---------------------------------- 2. 文字编辑 ---------------------------------- */
console.log('\n[2] 文字编辑（回到委托书）')
await gotoTab(page, '模板')
await page.locator('.tpl').nth(0).click()
await sleep(800)
await gotoTab(page, '图层')
// 选中第一个文字图层
await page.locator('.layer', { hasText: '主标题' }).first().click()
await sleep(400)
const sel = page.locator('.insp .tag')
ok((await sel.textContent())?.includes('文字'), '点击图层后右侧属性面板显示「文字」类型')
// 修改文字内容
const area = page.locator('.insp textarea')
await area.fill('委 托 书 · 改')
await sleep(500)
const docText = await page.evaluate(() => document.querySelector('.insp textarea').value)
ok(docText.includes('改'), '文字内容可通过属性面板修改')
await page.screenshot({ path: join(root, 'shots/edit-text.png') })

/* ---------------------------------- 3. 撤销 / 重做 ---------------------------------- */
console.log('\n[3] 撤销与重做')
await page.keyboard.press('Control+z')
await sleep(400)
const afterUndo = await page.evaluate(() => document.querySelector('.insp textarea')?.value ?? '')
ok(!afterUndo.includes('改'), `撤销后文字恢复原文（得到：${JSON.stringify(afterUndo)}）`)
await page.keyboard.press('Control+Shift+z')
await sleep(400)
const afterRedo = await page.evaluate(() => document.querySelector('.insp textarea')?.value ?? '')
ok(afterRedo.includes('改'), '重做后修改被恢复')

/* ---------------------------------- 4. 图层操作 ---------------------------------- */
console.log('\n[4] 图层排序')
const namesBefore = await page.evaluate(() => {
  return [...document.querySelectorAll('.layer .name')].map((n) => n.textContent)
})
// 选中「主标题」并置顶（列表是倒序显示，置顶 = 列表第一项）
await page.locator('.layer', { hasText: '主标题' }).first().click()
await page.locator('.layer-tools .btn', { hasText: '顶' }).click()
await sleep(400)
const namesAfter = await page.evaluate(() => [...document.querySelectorAll('.layer .name')].map((n) => n.textContent))
ok(namesAfter[0]?.includes('主标题') && namesBefore[0] !== namesAfter[0], `置顶成功（顶层现在是「${namesAfter[0]}」）`)
await page.keyboard.press('Escape')
await sleep(200)

/* ---------------------------------- 5. 图片导入 ---------------------------------- */
console.log('\n[5] 本地图片导入')
await gotoTab(page, '素材')
// 生成一张 200x120 的红蓝测试图
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAYAAAAprDJjAAAAGElEQVR4nO3BAQ0AAADCoPdMbQ8HFAAAAPAwEwAAAwEd3Q8AAAAASUVORK5CYII='
// 上面是占位灰图；用 canvas 生成更直观的红图
const dataUrl = await page.evaluate(() => {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 200
  const g = c.getContext('2d')
  g.fillStyle = '#8c3a2f'
  g.fillRect(0, 0, 320, 200)
  g.fillStyle = '#f3ead6'
  g.font = 'bold 40px serif'
  g.fillText('TEST', 90, 115)
  return c.toDataURL('image/png')
})
await page.locator('.drop').click()
await page.setInputFiles('.asset-panel input[type=file]', {
  name: 'test-image.png',
  mimeType: 'image/png',
  buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
})
await sleep(1200)
await gotoTab(page, '图层')
const imgLayer = page.locator('.layer', { hasText: 'test-image' })
ok((await imgLayer.count()) === 1, '图片加入画布并出现在图层列表')
await page.screenshot({ path: join(root, 'shots/with-image.png') })

/* ---------------------------------- 6. JSON 往返 ---------------------------------- */
console.log('\n[6] JSON 导出 / 导入往返')
const nameBeforeExport = await page.evaluate(() => document.querySelector('.name-input')?.value)
const exportName = `roundtrip_${Date.now()}.json`
const dl1 = page.waitForEvent('download', { timeout: 20000 })
await page.locator('.menu-wrap .btn').first().click()
await page.locator('.menu-item', { hasText: '导出项目 JSON' }).click()
const download1 = await dl1
await download1.saveAs(join(root, 'e2e-out', exportName))
ok(download1.suggestedFilename().endsWith('.json'), `JSON 已导出（${download1.suggestedFilename()}）`)

// 导入回来
await page.locator('.menu-wrap .btn').first().click()
await page.locator('.menu-item', { hasText: '导入项目 JSON' }).click()
await page.setInputFiles('.topbar input[type=file]', join(root, 'e2e-out', exportName))
await sleep(1000)
const imported = await layerCount(page)
const orig = imported
ok(imported > 5, `导入后元素数量一致（${imported}）`)
// 校验文件结构
const saved = JSON.parse(readFileSync(join(root, 'e2e-out', exportName), 'utf8'))
ok(saved.schemaVersion === 1 && Array.isArray(saved.elements) && saved.assets.length >= 1, 'JSON 含 schemaVersion / elements / assets')
ok(saved.assets[0].dataUrl.startsWith('data:image/png;base64,'), '图片以 dataURL 内嵌（自包含文件）')

/* ---------------------------------- 7. 刷新恢复 ---------------------------------- */
console.log('\n[7] 刷新后本地项目恢复')
const nameAfterImport = nameBeforeExport
await page.reload({ waitUntil: 'networkidle' })
await sleep(1500)
const nameAfterReload = await page.evaluate(() => document.querySelector('.name-input')?.value)
const elementsAfterReload = await layerCount(page)
ok(nameAfterReload === nameBeforeExport && elementsAfterReload === imported, `刷新后恢复「${nameAfterReload}」（${elementsAfterReload} 个元素）`)
await page.screenshot({ path: join(root, 'shots/after-reload.png') })

/* ---------------------------------- 8. PNG 导出 ---------------------------------- */
console.log('\n[8] PNG 导出（300dpi）')
await page.locator('.export-btn').click()
await sleep(1200)
await page.screenshot({ path: join(root, 'shots/export-dialog.png') })
const dlPng = page.waitForEvent('download', { timeout: 60000 })
await page.locator('.dfoot .btn.primary').click()
const downloadPng = await dlPng
const pngPath = join(root, 'e2e-out', downloadPng.suggestedFilename())
await downloadPng.saveAs(pngPath)
const png = readFileSync(pngPath)
// PNG IHDR: 宽高在字节 16-23
const pngW = png.readUInt32BE(16)
const pngH = png.readUInt32BE(20)
ok(pngW > 1500 && Math.abs(pngW / pngH - 148 / 210) < 0.02, `PNG 尺寸 ${pngW}×${pngH}（A5 纵向比例，300dpi）`)
ok(png.length > 100_000, `PNG 文件 ${Math.round(png.length / 1024)}KB（有实际内容）`)

// PDF 导出
console.log('\n[9] PDF 导出')
await page.locator('.seg-btn', { hasText: 'PDF 文档' }).click()
await sleep(300)
const dlPdf = page.waitForEvent('download', { timeout: 60000 })
await page.locator('.dfoot .btn.primary').click()
const downloadPdf = await dlPdf
const pdfPath = join(root, 'e2e-out', downloadPdf.suggestedFilename())
await downloadPdf.saveAs(pdfPath)
const pdf = readFileSync(pdfPath, 'latin1')
const mbox = [...pdf.matchAll(/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)]
const box = mbox[0]
const wPt = box ? +box[3] - +box[1] : 0
const hPt = box ? +box[4] - +box[2] : 0
const wMm = (wPt * 25.4) / 72
const hMm = (hPt * 25.4) / 72
ok(Math.abs(wMm - 148) < 1 && Math.abs(hMm - 210) < 1, `PDF 页面 ${wMm.toFixed(1)}×${hMm.toFixed(1)}mm（A5）`)
await page.keyboard.press('Escape')

// PDF 纸张尺寸：切到 A4 / A6 再各导一次
for (const size of ['A4', 'A6']) {
  await page.locator('.insp .seg-btn', { hasText: size }).first().click()
  await sleep(600)
  await page.locator('.export-btn').click()
  await sleep(1000)
  await page.locator('.seg-btn', { hasText: 'PDF 文档' }).click()
  await sleep(300)
  const dl = page.waitForEvent('download', { timeout: 60000 })
  await page.locator('.dfoot .btn.primary').click()
  const d = await dl
  const p = join(root, 'e2e-out', d.suggestedFilename())
  await d.saveAs(p)
  const raw = readFileSync(p, 'latin1')
  const m = /MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(raw)
  const ww = ((+m[3] - +m[1]) * 25.4) / 72
  const hh = ((+m[4] - +m[2]) * 25.4) / 72
  const expect = size === 'A4' ? [210, 297] : [105, 148]
  ok(Math.abs(ww - expect[0]) < 1 && Math.abs(hh - expect[1]) < 1, `PDF ${size} 页面 ${ww.toFixed(1)}×${hh.toFixed(1)}mm`)
  await page.keyboard.press('Escape')
  await sleep(300)
}
// 恢复 A5
await page.locator('.insp .seg-btn', { hasText: 'A5' }).first().click()
await sleep(400)

/* ---------------------------------- 10. 移动端 ---------------------------------- */
console.log('\n[10] 移动端（390×844）')
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, hasTouch: true, isMobile: true })
const mp = await mctx.newPage()
await mp.goto(URL, { waitUntil: 'networkidle' })
await sleep(1500)
await mp.screenshot({ path: join(root, 'shots/mobile.png') })
// 打开左侧抽屉
await mp.locator('.only-mobile').first().click()
await sleep(500)
await mp.screenshot({ path: join(root, 'shots/mobile-left.png') })
// 添加文字
await mp.locator('.tab', { hasText: '素材' }).click()
await sleep(400)
await mp.locator('.btn', { hasText: '添加文字块' }).click()
await sleep(700)
await gotoTab(mp, '图层')
const mobileLayers = await mp.locator('.layer').count()
ok(mobileLayers > 10, `移动端可以添加元素（图层 ${mobileLayers}）`)
// 打开右侧属性
await mp.locator('.only-mobile').nth(1).click()
await sleep(500)
await mp.screenshot({ path: join(root, 'shots/mobile-right.png') })
const ta = mp.locator('.insp textarea')
ok((await ta.count()) === 1, '移动端可以打开属性面板编辑文字')
await mp.locator('.only-mobile').nth(1).click()
await mctx.close()

/* ---------------------------------- 汇总 ---------------------------------- */
console.log(`\n========== 结果: ${pass} 通过 / ${fail} 失败 ==========`)
if (errors.length) {
  console.log('\n控制台错误:')
  for (const e of errors.slice(0, 10)) console.log('  -', e)
}
writeFileSync(join(root, 'e2e-out', 'summary.json'), JSON.stringify({ pass, fail, fails, consoleErrors: errors }, null, 2))
await browser.close()
process.exit(fail ? 1 : 0)
