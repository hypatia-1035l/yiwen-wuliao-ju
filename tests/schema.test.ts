import { describe, expect, it } from 'vitest'
import { validateProject } from '@/core/schema'
import { SCHEMA_VERSION, type ProjectDoc } from '@/types/project'

function validDoc(): ProjectDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: 'yiwen-wuliao-ju',
    id: 'proj_test',
    name: '测试',
    createdAt: 1,
    updatedAt: 1,
    templateId: 'commission',
    page: { size: 'A4', orientation: 'portrait', color: '#f3ead6', background: 'paper', texture: 0.4, margin: 40 },
    assets: [
      {
        id: 'asset_1',
        name: 'a.png',
        mime: 'image/png',
        dataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        width: 1,
        height: 1,
        createdAt: 1,
      },
    ],
    elements: [
      {
        id: 'el_1',
        type: 'text',
        name: 't',
        x: 10,
        y: 10,
        width: 100,
        height: 20,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: '你好',
        fontSize: 16,
        fontFamily: 'serif',
        fontStyle: 'normal',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.6,
        letterSpacing: 0,
        fill: '#000000',
        autoHeight: true,
        padding: 0,
      },
      {
        id: 'el_2',
        type: 'image',
        name: 'img',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        assetId: 'asset_1',
        fit: 'cover',
        tone: 'none',
        cornerRadius: 0,
        stroke: 'transparent',
        strokeWidth: 0,
      },
    ],
  }
}

describe('项目文件校验', () => {
  it('合法文件通过且字段齐全', () => {
    const r = validateProject(validDoc())
    expect(r.ok).toBe(true)
    expect(r.doc?.elements).toHaveLength(2)
    expect(r.errors).toHaveLength(0)
  })

  it('拒绝非对象 / 缺版本 / 未来版本', () => {
    expect(validateProject(null).ok).toBe(false)
    expect(validateProject('x').ok).toBe(false)
    expect(validateProject([]).ok).toBe(false)
    expect(validateProject({ ...validDoc(), schemaVersion: undefined }).ok).toBe(false)
    const future = validateProject({ ...validDoc(), schemaVersion: SCHEMA_VERSION + 1 })
    expect(future.ok).toBe(false)
    expect(future.errors[0]).toContain('高于当前支持')
  })

  it('NaN / Infinity 数值被回落为默认值，不产生 NaN 文档', () => {
    const doc = validDoc()
    const el = doc.elements[0] as unknown as Record<string, unknown>
    el.x = Number.NaN
    el.width = Number.POSITIVE_INFINITY
    el.fontSize = 'not-a-number' as unknown as number
    const r = validateProject(doc)
    expect(r.ok).toBe(true)
    const t = r.doc!.elements[0]
    expect(Number.isFinite(t.x)).toBe(true)
    expect(t.width).toBeLessThanOrEqual(20000)
    expect((t as { fontSize: number }).fontSize).toBe(16)
  })

  it('拒绝 SVG dataURL（可携带脚本）', () => {
    const doc = validDoc()
    doc.assets[0].dataUrl = 'data:image/svg+xml;base64,PHN2Zy8+'
    const r = validateProject(doc)
    expect(r.ok).toBe(true)
    expect(r.doc?.assets).toHaveLength(0)
    expect(r.doc?.elements).toHaveLength(1) // 引用失效的图片元素被丢弃
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('拒绝 javascript: 之类的伪 URL', () => {
    const doc = validDoc()
    doc.assets[0].dataUrl = 'javascript:alert(1)' as unknown as string
    const r = validateProject(doc)
    expect(r.doc?.assets).toHaveLength(0)
  })

  it('未知元素类型被丢弃并告警', () => {
    const doc = validDoc()
    doc.elements.push({ id: 'x', type: 'video' } as never)
    const r = validateProject(doc)
    expect(r.doc?.elements).toHaveLength(2)
    expect(r.warnings.some((w) => w.includes('video'))).toBe(true)
  })

  it('序列化 → 校验 往返还原（深度相等）', () => {
    const doc = validDoc()
    const r1 = validateProject(JSON.parse(JSON.stringify(doc)))
    expect(r1.ok).toBe(true)
    const r2 = validateProject(JSON.parse(JSON.stringify(r1.doc)))
    expect(r2.doc).toEqual(r1.doc)
  })

  it('超长文本被截断而不是崩溃', () => {
    const doc = validDoc()
    ;(doc.elements[0] as { text: string }).text = '啊'.repeat(50000)
    const r = validateProject(doc)
    expect(r.ok).toBe(true)
    expect((r.doc!.elements[0] as { text: string }).text.length).toBeLessThanOrEqual(20000)
  })
})
