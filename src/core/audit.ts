import { pageSizePx } from '@/core/paper'
import type { ElementDoc, ProjectDoc } from '@/types/project'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** 旋转后的轴对齐包围盒（编辑器内部用于越界检查与对齐提示） */
export function boundsOf(el: Pick<ElementDoc, 'x' | 'y' | 'width' | 'height' | 'rotation'>): Box {
  if (!el.rotation) return { x: el.x, y: el.y, width: el.width, height: el.height }
  const rad = (el.rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const w = el.width * cos + el.height * sin
  const h = el.width * sin + el.height * cos
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h }
}

export type OverflowSide = 'left' | 'right' | 'top' | 'bottom'

export interface OverflowItem {
  id: string
  name: string
  sides: OverflowSide[]
  /** 超出纸张的毫米数（取最大边） */
  mm: number
}

export interface FontIssue {
  family: string
  available: boolean
}

export interface PreflightResult {
  overflow: OverflowItem[]
  missingAssets: { id: string; name: string }[]
  fonts: FontIssue[]
  elementsOutside: number
}

/**
 * 导出前体检：
 * 1. 元素是否超出纸张边界（会被裁掉）
 * 2. 图片元素是否引用了不存在的资源（会导出空白）
 * 3. 使用的字体在本机是否存在（缺失会静默回退成其它字体，导致排版走样）
 */
export async function preflight(doc: ProjectDoc): Promise<PreflightResult> {
  const { width: W, height: H } = pageSizePx(doc.page)
  const px2mm = 25.4 / 96

  const overflow: OverflowItem[] = []
  for (const el of doc.elements) {
    if (!el.visible) continue
    const b = boundsOf(el)
    const sides: OverflowSide[] = []
    if (b.x < -0.5) sides.push('left')
    if (b.y < -0.5) sides.push('top')
    if (b.x + b.width > W + 0.5) sides.push('right')
    if (b.y + b.height > H + 0.5) sides.push('bottom')
    if (!sides.length) continue
    const over = Math.max(
      Math.max(0, -b.x),
      Math.max(0, -b.y),
      Math.max(0, b.x + b.width - W),
      Math.max(0, b.y + b.height - H),
    )
    overflow.push({ id: el.id, name: el.name, sides, mm: Math.round(over * px2mm * 10) / 10 })
  }

  const assetIds = new Set(doc.assets.map((a) => a.id))
  const missingAssets = doc.elements
    .filter((e) => e.type === 'image' && !assetIds.has((e as { assetId: string }).assetId))
    .map((e) => ({ id: e.id, name: e.name }))

  const families = new Set<string>()
  for (const el of doc.elements) {
    if (el.type === 'text' && el.text.trim()) families.add(el.fontFamily)
  }

  const fonts: FontIssue[] = []
  if (typeof document !== 'undefined' && document.fonts) {
    for (const family of families) {
      let available = true
      try {
        available = document.fonts.check(`16px ${family}`)
      } catch {
        available = true
      }
      fonts.push({ family, available })
    }
  }

  return { overflow, missingAssets, fonts, elementsOutside: overflow.length }
}

/** 导出时建议使用的像素比例，防止超出浏览器 canvas 上限 */
export function clampExportScale(scale: number, pageW: number, pageH: number): { scale: number; capped: boolean } {
  const MAX_EDGE = 9000
  const maxPixels = 72 * 1000 * 1000
  let s = scale
  let capped = false
  if (pageW * s > MAX_EDGE || pageH * s > MAX_EDGE) {
    s = Math.min(MAX_EDGE / pageW, MAX_EDGE / pageH)
    capped = true
  }
  if (pageW * s * pageH * s > maxPixels) {
    s = Math.sqrt(maxPixels / (pageW * pageH))
    capped = true
  }
  return { scale: s, capped }
}
