import { describe, expect, it } from 'vitest'
import { TEMPLATES } from '@/data/templates'
import { validateProject } from '@/core/schema'
import { PAPER_MM } from '@/types/project'

describe('模板', () => {
  it('注册了四种模板', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['commission', 'dossier', 'wanted', 'diary'])
  })

  for (const t of TEMPLATES) {
    it(`「${t.name}」产出结构完整、可校验的文档`, () => {
      const doc = t.build()
      expect(doc.schemaVersion).toBe(1)
      expect(doc.page.size).toBe(t.size)
      expect(doc.elements.length).toBeGreaterThan(5)
      expect(doc.templateId).toBe(t.id)

      // 所有元素 id 唯一且非空
      const ids = new Set(doc.elements.map((e) => e.id))
      expect(ids.size).toBe(doc.elements.length)
      for (const id of ids) expect(id.length).toBeGreaterThan(3)

      // 数值全部有限
      for (const el of doc.elements) {
        for (const v of [el.x, el.y, el.width, el.height, el.rotation, el.opacity]) {
          expect(Number.isFinite(v)).toBe(true)
        }
      }

      // 元素坐标在纸面附近（允许出血装饰，但不允许离谱）
      const page = PAPER_MM[doc.page.size]
      const maxMm = Math.max(page.width, page.height) * 2
      for (const el of doc.elements) {
        expect(el.x).toBeLessThan(maxMm * 3.78) // mm→px
        expect(el.y).toBeLessThan(maxMm * 3.78)
      }

      // 能通过导入校验（即可以直接被导出再导入）
      const r = validateProject(JSON.parse(JSON.stringify(doc)))
      expect(r.ok).toBe(true)
      expect(r.errors).toHaveLength(0)
    })

    it(`「${t.name}」两次构建产生不同的文档 id 与元素 id`, () => {
      const a = t.build()
      const b = t.build()
      expect(a.id).not.toBe(b.id)
      expect(a.elements[0].id).not.toBe(b.elements[0].id)
    })

    it(`「${t.name}」至少有一个可编辑文字块`, () => {
      const doc = t.build()
      const texts = doc.elements.filter((e) => e.type === 'text' && e.text.trim().length > 0)
      expect(texts.length).toBeGreaterThan(0)
    })
  }
})
