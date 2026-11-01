import { PAPER_MM, type Orientation, type PageDoc, type PaperSize } from '@/types/project'

/** CSS 参考像素：1in = 96px，1in = 25.4mm */
export const DPI_BASE = 96
export const MM_PER_INCH = 25.4

export function mmToPx(mm: number): number {
  return (mm * DPI_BASE) / MM_PER_INCH
}

export function pxToMm(px: number): number {
  return (px * MM_PER_INCH) / DPI_BASE
}

/** 纸张物理尺寸（毫米），已考虑横竖向 */
export function pageSizeMm(size: PaperSize, orientation: Orientation): { width: number; height: number } {
  const base = PAPER_MM[size]
  return orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height }
}

/** 纸张在文档坐标系中的像素尺寸（px@96），保留小数避免比例误差 */
export function pageSizePx(page: Pick<PageDoc, 'size' | 'orientation'>): { width: number; height: number } {
  const mm = pageSizeMm(page.size, page.orientation)
  return { width: mmToPx(mm.width), height: mmToPx(mm.height) }
}

/**
 * 导出像素比例：把文档 px@96 放大到目标 DPI。
 * 例如 300dpi → 300/96 = 3.125，A4 得到 2480×3508 的真实像素。
 */
export function scaleForDpi(dpi: number): number {
  return dpi / DPI_BASE
}

/** 导出后的实际像素尺寸，用于导出前提示 */
export function exportPixelSize(page: Pick<PageDoc, 'size' | 'orientation'>, dpi: number) {
  const px = pageSizePx(page)
  const s = scaleForDpi(dpi)
  return { width: Math.round(px.width * s), height: Math.round(px.height * s) }
}

export const MM_TO_PT = 72 / 25.4
export function pxToPt(px: number): number {
  return (px * 72) / DPI_BASE
}
export function ptToPx(pt: number): number {
  return (pt * DPI_BASE) / 72
}
