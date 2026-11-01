import { newId } from '@/core/id'
import { DEFAULT_FONT } from '@/core/fonts'
import { PALETTE } from '@/core/palette'
import {
  APP_ID,
  SCHEMA_VERSION,
  type AssetDoc,
  type ElementDoc,
  type ImageElement,
  type PageDoc,
  type ProjectDoc,
  type ShapeElement,
  type ShapeKind,
  type TextElement,
} from '@/types/project'

export interface ValidationResult {
  ok: boolean
  doc?: ProjectDoc
  errors: string[]
  warnings: string[]
  /** 若文件来自更早的 schema 版本，记录原始版本号 */
  migratedFrom?: number
}

const MAX_ELEMENTS = 2000
const MAX_ASSETS = 200
const MAX_DATAURL = 24 * 1024 * 1024
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB = /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/i
/**
 * 只接受位图 dataURL。刻意排除 image/svg+xml：
 * SVG 可携带脚本，导入他人文件时不应被当作可渲染内容。
 */
const DATAURL = /^data:image\/(?:png|jpeg|jpg|webp|gif|bmp|avif);base64,[A-Za-z0-9+/=\s]+$/i

const PAPER_SIZES = new Set(['A4', 'A5', 'A6'])
const SHAPES = new Set<ShapeKind>(['rect', 'ellipse', 'line', 'frame', 'seal'])
const TONES = new Set(['none', 'gray', 'sepia', 'blueprint'])
const FITS = new Set(['cover', 'contain', 'fill'])
const TEXT_ALIGNS = new Set(['left', 'center', 'right', 'justify'])
const V_ALIGNS = new Set(['top', 'middle', 'bottom'])

export function isColor(value: unknown): value is string {
  return typeof value === 'string' && (value === 'transparent' || HEX.test(value) || RGB.test(value))
}

export function num(value: unknown, fallback: number, min = -1e6, max = 1e6): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function str(value: unknown, fallback: string, maxLen = 400): string {
  if (typeof value !== 'string') return fallback
  return value.length > maxLen ? value.slice(0, maxLen) : value
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function pick<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : fallback
}

function dashArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 8).map((v) => num(v, 0, 0, 400))
}

/** 单元素校验：返回 null 表示丢弃 */
function parseElement(raw: unknown, assetIds: Set<string>, warnings: string[]): ElementDoc | null {
  if (!raw || typeof raw !== 'object') {
    warnings.push('跳过了一个不是对象的元素')
    return null
  }
  const o = raw as Record<string, unknown>
  const type = o.type
  if (type !== 'text' && type !== 'image' && type !== 'shape') {
    warnings.push(`跳过了未知类型的元素（type=${String(type)}）`)
    return null
  }

  const id = typeof o.id === 'string' && o.id.length > 0 && o.id.length <= 100 ? o.id : newId('el')
  const common = {
    id,
    name: str(o.name, '元素', 80),
    x: num(o.x, 0),
    y: num(o.y, 0),
    width: num(o.width, 100, 1, 20000),
    height: num(o.height, 60, 1, 20000),
    rotation: num(o.rotation, 0, -36000, 36000),
    opacity: num(o.opacity, 1, 0, 1),
    visible: bool(o.visible, true),
    locked: bool(o.locked, false),
  }

  if (type === 'text') {
    const el: TextElement = {
      ...common,
      type: 'text',
      text: str(o.text, '', 20000),
      fontSize: num(o.fontSize, 16, 1, 800),
      fontFamily: str(o.fontFamily, DEFAULT_FONT, 300),
      fontStyle: pick(o.fontStyle, new Set(['normal', 'bold', 'italic', 'bold italic']), 'normal'),
      align: pick(o.align, TEXT_ALIGNS, 'left'),
      verticalAlign: pick(o.verticalAlign, V_ALIGNS, 'top'),
      lineHeight: num(o.lineHeight, 1.6, 0.5, 5),
      letterSpacing: num(o.letterSpacing, 0, -50, 200),
      fill: isColor(o.fill) ? o.fill : PALETTE.ink,
      autoHeight: bool(o.autoHeight, true),
      padding: num(o.padding, 0, 0, 400),
    }
    return el
  }

  if (type === 'image') {
    const assetId = typeof o.assetId === 'string' ? o.assetId : ''
    if (!assetIds.has(assetId)) {
      warnings.push(`跳过了一张图片元素「${common.name}」：它引用的资源不在文件里`)
      return null
    }
    const el: ImageElement = {
      ...common,
      type: 'image',
      assetId,
      fit: pick(o.fit, FITS, 'cover'),
      tone: pick(o.tone, TONES, 'none'),
      cornerRadius: num(o.cornerRadius, 0, 0, 2000),
      stroke: isColor(o.stroke) ? o.stroke : 'transparent',
      strokeWidth: num(o.strokeWidth, 0, 0, 80),
    }
    return el
  }

  const el: ShapeElement = {
    ...common,
    type: 'shape',
    shape: pick(o.shape, SHAPES, 'rect'),
    fill: isColor(o.fill) ? o.fill : 'transparent',
    stroke: isColor(o.stroke) ? o.stroke : PALETTE.ink,
    strokeWidth: num(o.strokeWidth, 1, 0, 80),
    cornerRadius: num(o.cornerRadius, 0, 0, 2000),
    dash: dashArray(o.dash),
    text: typeof o.text === 'string' ? str(o.text, '', 200) : undefined,
    textColor: isColor(o.textColor) ? o.textColor : PALETTE.rust,
    fontSize: num(o.fontSize, 14, 4, 400),
  }
  return el
}

function parseAsset(raw: unknown, warnings: string[]): AssetDoc | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const dataUrl = o.dataUrl
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_DATAURL || !DATAURL.test(dataUrl)) {
    warnings.push('跳过了一个无效或不受支持的图片资源（仅接受位图 dataURL）')
    return null
  }
  const mimeMatch = /^data:(image\/[a-z+]+);base64,/i.exec(dataUrl)
  return {
    id: typeof o.id === 'string' && o.id.length <= 100 ? o.id : newId('asset'),
    name: str(o.name, '图片', 200),
    mime: mimeMatch ? mimeMatch[1].toLowerCase() : 'image/png',
    dataUrl,
    width: num(o.width, 0, 0, 40000),
    height: num(o.height, 0, 0, 40000),
    createdAt: num(o.createdAt, Date.now()),
  }
}

function parsePage(raw: unknown, warnings: string[]): PageDoc {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const size = pick(o.size, PAPER_SIZES, 'A4')
  if (o.size !== undefined && !PAPER_SIZES.has(String(o.size))) {
    warnings.push(`未知纸张规格「${String(o.size)}」，已回落为 A4`)
  }
  return {
    size,
    orientation: o.orientation === 'landscape' ? 'landscape' : 'portrait',
    color: isColor(o.color) ? o.color : PALETTE.paper,
    background: o.background === 'paper' ? 'paper' : 'color',
    texture: num(o.texture, 0.5, 0, 1),
    margin: num(o.margin, 48, 0, 400),
  }
}

/**
 * 校验并归一化一个外部 JSON 对象。
 * 任何不合法数据都被「丢弃或回落默认值」，不会抛出异常，也不会让半成品进入编辑状态。
 */
export function validateProject(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['文件内容不是项目对象'], warnings }
  }
  const o = raw as Record<string, unknown>

  const version = o.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    errors.push('缺少合法的 schemaVersion 字段，无法判断文件格式')
    return { ok: false, errors, warnings }
  }
  if (version > SCHEMA_VERSION) {
    errors.push(
      `文件版本 ${version} 高于当前支持的版本 ${SCHEMA_VERSION}，请升级编辑器后再打开（为避免数据损坏，本次导入已中止）`,
    )
    return { ok: false, errors, warnings }
  }
  if (o.app !== undefined && o.app !== APP_ID) {
    warnings.push(`文件来源标记为「${String(o.app)}」，仍按当前格式尝试读取`)
  }

  const rawAssets = Array.isArray(o.assets) ? o.assets.slice(0, MAX_ASSETS) : []
  const assets: AssetDoc[] = []
  for (const a of rawAssets) {
    const parsed = parseAsset(a, warnings)
    if (parsed) assets.push(parsed)
  }
  if (Array.isArray(o.assets) && o.assets.length > MAX_ASSETS) {
    warnings.push(`图片资源超过 ${MAX_ASSETS} 个，超出部分已忽略`)
  }

  const assetIds = new Set(assets.map((a) => a.id))
  const rawEls = Array.isArray(o.elements) ? o.elements : []
  if (!Array.isArray(o.elements)) warnings.push('elements 不是数组，已按空画布处理')
  if (rawEls.length > MAX_ELEMENTS) {
    warnings.push(`元素数量超过 ${MAX_ELEMENTS} 个上限，超出部分已忽略`)
  }

  const elements: ElementDoc[] = []
  const seen = new Set<string>()
  for (const e of rawEls.slice(0, MAX_ELEMENTS)) {
    const parsed = parseElement(e, assetIds, warnings)
    if (!parsed) continue
    if (seen.has(parsed.id)) parsed.id = newId('el')
    seen.add(parsed.id)
    elements.push(parsed)
  }

  const doc: ProjectDoc = {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    id: typeof o.id === 'string' && o.id.length > 0 ? o.id : newId('proj'),
    name: str(o.name, '未命名物料', 120),
    createdAt: num(o.createdAt, Date.now()),
    updatedAt: num(o.updatedAt, Date.now()),
    templateId: str(o.templateId, 'custom', 60),
    page: parsePage(o.page, warnings),
    assets,
    elements,
  }

  return {
    ok: true,
    doc,
    errors,
    warnings,
    ...(version < SCHEMA_VERSION ? { migratedFrom: version } : {}),
  }
}
