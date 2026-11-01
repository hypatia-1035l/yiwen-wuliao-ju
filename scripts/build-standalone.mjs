/**
 * 生成「双击即开」的单文件 html。
 *
 * 背景：dist/index.html 用的是 <script type="module" crossorigin>，
 * 双击后浏览器以 file:// 打开，模块脚本会被当作跨源请求拦掉，页面只剩深色底 → 全黑。
 *
 * 本脚本：
 *  1. 用 vite.standalone.config.ts 打成 IIFE（非 module）
 *  2. 把 JS / CSS 全部内联进 html
 *  3. 产出 异闻物料局.html（项目根目录），双击即可运行
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(root, '..')
const outDir = join(projectRoot, 'dist-standalone')
const target = join(projectRoot, '异闻物料局.html')

console.log('[1/3] 构建 IIFE 包 ...')
execSync('npx vite build --config vite.standalone.config.ts', {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
})

const htmlPath = join(outDir, 'index.html')
if (!existsSync(htmlPath)) throw new Error(`构建产物缺失：${htmlPath}`)
let html = readFileSync(htmlPath, 'utf8')

/** 内联 <script src>；同时把 </script 转义，避免在 JS 字符串里提前闭合标签 */
function inlineScripts(source) {
  return source.replace(
    /<script\b([^>]*?)\bsrc="([^"]+)"([^>]*)><\/script>/gi,
    (_m, pre, src, post) => {
      const file = join(outDir, src.replace(/^\.\//, ''))
      if (!existsSync(file)) throw new Error(`脚本文件缺失：${file}`)
      const code = readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script')
      const attrs = `${pre} ${post}`
        .replace(/\bcrossorigin\b/gi, '')
        .replace(/\btype="module"\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      return `<script${attrs ? ' ' + attrs : ''}>${code}</script>`
    },
  )
}

/** 内联 <link rel=stylesheet> */
function inlineStyles(source) {
  return source.replace(
    /<link\b([^>]*?)\bhref="([^"]+\.css)"([^>]*?)\/?>/gi,
    (_m, pre, href) => {
      if (!/stylesheet/i.test(pre + _m)) return _m
      const file = join(outDir, href.replace(/^\.\//, ''))
      if (!existsSync(file)) throw new Error(`样式文件缺失：${file}`)
      const css = readFileSync(file, 'utf8').replace(/<\/style/gi, '<\\/style')
      return `<style>${css}</style>`
    },
  )
}

console.log('[2/3] 内联资源 ...')
html = inlineStyles(html)
html = inlineScripts(html)

if (/<script[^>]*\bsrc=|<link[^>]*stylesheet/i.test(html)) {
  throw new Error('仍有外部资源未内联，file:// 下会失败')
}

console.log('[3/3] 写出单文件 ...')
writeFileSync(target, html, 'utf8')
const kb = (statSync(target).size / 1024).toFixed(0)
console.log(`完成：${target}（${kb} KB）`)
