import { describe, expect, it } from 'vitest'
import { exportPixelSize, mmToPx, pageSizeMm, pageSizePx, pxToMm, scaleForDpi } from '@/core/paper'
import { PAPER_MM } from '@/types/project'

describe('纸张尺寸换算', () => {
  it('mm ↔ px 互逆', () => {
    for (const mm of [10, 148, 210, 297]) {
      expect(pxToMm(mmToPx(mm))).toBeCloseTo(mm, 6)
    }
  })

  it('A4 纵向 = 210×297mm = 793.7×1122.5px', () => {
    const mm = pageSizeMm('A4', 'portrait')
    expect(mm.width).toBe(210)
    expect(mm.height).toBe(297)
    const px = pageSizePx({ size: 'A4', orientation: 'portrait' })
    expect(px.width).toBeCloseTo(793.7, 1)
    expect(px.height).toBeCloseTo(1122.5, 1)
  })

  it('横向交换宽高，但物理面积不变', () => {
    const p = pageSizeMm('A5', 'portrait')
    const l = pageSizeMm('A5', 'landscape')
    expect(l.width).toBe(p.height)
    expect(l.height).toBe(p.width)
  })

  it('300dpi 的像素比 = 3.125', () => {
    expect(scaleForDpi(300)).toBeCloseTo(3.125, 6)
    const out = exportPixelSize({ size: 'A4', orientation: 'portrait' }, 300)
    expect(out.width).toBe(2480)
    expect(out.height).toBe(3508)
  })

  it('纸型表覆盖 A4/A5/A6', () => {
    expect(Object.keys(PAPER_MM).sort()).toEqual(['A4', 'A5', 'A6'])
  })
})
