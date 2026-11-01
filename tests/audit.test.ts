import { describe, expect, it } from 'vitest'
import { boundsOf, clampExportScale } from '@/core/audit'
import { createText, createShape } from '@/core/factory'

describe('越界检查', () => {
  it('未旋转元素返回自身框', () => {
    const el = createText({ x: 10, y: 20, width: 100, height: 40 })
    expect(boundsOf(el)).toEqual({ x: 10, y: 20, width: 100, height: 40 })
  })

  it('旋转 90° 时包围盒宽高互换', () => {
    const el = createText({ x: 100, y: 100, width: 200, height: 40, rotation: 90 })
    const b = boundsOf(el)
    expect(b.width).toBeCloseTo(40, 6)
    expect(b.height).toBeCloseTo(200, 6)
    // 绕中心旋转，中心不变
    expect(b.x + b.width / 2).toBeCloseTo(200, 6)
    expect(b.y + b.height / 2).toBeCloseTo(120, 6)
  })

  it('45° 时包围盒变大', () => {
    const el = createShape('rect', { x: 0, y: 0, width: 100, height: 100, rotation: 45 })
    const b = boundsOf(el)
    expect(b.width).toBeCloseTo(100 * Math.SQRT2, 1)
  })
})

describe('导出缩放保护', () => {
  it('正常 dpi 不截断', () => {
    const r = clampExportScale(3.125, 793.7, 1122.5)
    expect(r.capped).toBe(false)
    expect(r.scale).toBeCloseTo(3.125, 6)
  })

  it('过大的画布会被限制到安全像素', () => {
    const r = clampExportScale(10, 793.7, 1122.5)
    expect(r.capped).toBe(true)
    expect(r.scale).toBeLessThan(10)
    expect(793.7 * r.scale).toBeLessThanOrEqual(9000)
    expect(1122.5 * r.scale).toBeLessThanOrEqual(9000)
  })
})
